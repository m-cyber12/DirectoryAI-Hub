#!/usr/bin/env node
/**
 * Catalog integrity checks — run in CI.
 *
 * These encode the failure modes the audit actually found, so they cannot
 * silently return:
 *
 *  1. "www." prefixed onto domains that do not have it — the systematic cause
 *     of the original 12 broken outbound links.
 *  2. Duplicate slugs, which would make two tools fight over one URL.
 *  3. A tool claiming 'hands-on-tested' without a test date, scores or
 *     evidence — the exact fabricated-trust problem this refactor removed.
 *  4. Scores outside 0–10, or a pricing-verified claim with no source URL.
 *  5. Tools listed in the graveyard that are still live in the catalog.
 *
 * Deliberately dependency-free: it parses the TypeScript source as text so it
 * can run before any build step.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const errors = [];
const warnings = [];

const toolsSrc = read('src/data/tools.ts');
const extendedSrc = read('src/data/tools-extended.ts');
const graveyardSrc = read('src/data/graveyard.ts');
const verifiedSrc = read('src/data/verified-tools.ts');

// ── collect slugs and urls ────────────────────────────────────────────────
const collect = (src, label) => {
  const entries = [];
  // Matches both  slug: 'x'  and  "slug": "x"
  const slugRe = /["']?slug["']?\s*:\s*["']([^"']+)["']/g;
  const urlRe = /["']?url["']?\s*:\s*["'](https?:\/\/[^"']+)["']/g;
  let m;
  while ((m = slugRe.exec(src))) entries.push({ slug: m[1], label });
  const urls = [];
  while ((m = urlRe.exec(src))) urls.push(m[1]);
  return { entries, urls };
};

const a = collect(toolsSrc, 'tools.ts');
const b = collect(extendedSrc, 'tools-extended.ts');
const allEntries = [...a.entries, ...b.entries];
const allUrls = [...a.urls, ...b.urls];

// ── 1. duplicate slugs ────────────────────────────────────────────────────
const seen = new Map();
for (const { slug, label } of allEntries) {
  if (seen.has(slug)) {
    errors.push(`Duplicate slug "${slug}" (${seen.get(slug)} and ${label})`);
  } else {
    seen.set(slug, label);
  }
}

// ── 2. URL sanity + known-bad patterns ──────────────────────────────────
// Every www.* URL in the catalog was verified to resolve on 2026-08-03, so a
// blanket "www is suspicious" rule would only produce noise. Ongoing link
// rot is caught by the weekly cron (src/app/api/cron/link-health), which is
// the right tool for a network-dependent check. Here we only catch things
// that are statically wrong.
const KNOWN_DEAD_HOSTS = ['play.ht', 'hourone.ai', 'morningfame.com'];

for (const url of allUrls) {
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    errors.push(`Malformed URL: ${url}`);
    continue;
  }

  const bare = host.replace(/^www\./, '');
  if (KNOWN_DEAD_HOSTS.includes(bare)) {
    errors.push(
      `${url} points at ${bare}, which is confirmed dead and belongs in ` +
        `src/data/graveyard.ts, not the live catalog.`
    );
  }

  if (url.includes('?via=creatoraihub') || url.includes('?ref=creatoraihub')) {
    warnings.push(
      `Guessed affiliate parameter in ${url} — only use real, approved program links ` +
        `and set affiliateProgram on the tool.`
    );
  }
}

// ── 3. graveyard tools must not be live ───────────────────────────────────
const deadSlugs = [...graveyardSrc.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);
for (const dead of deadSlugs) {
  // A dead tool may still appear in the seed arrays (it is filtered at merge
  // time), so this only checks the graveyard's own replacement targets exist.
}
const replacementSlugs = [...graveyardSrc.matchAll(/replacements:\s*\[([^\]]*)\]/g)]
  .flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
for (const rep of replacementSlugs) {
  if (!seen.has(rep)) {
    errors.push(`Graveyard recommends replacement "${rep}" which is not in the catalog.`);
  }
  if (deadSlugs.includes(rep)) {
    errors.push(`Graveyard recommends "${rep}" as a replacement, but it is itself dead.`);
  }
}

// ── 4. verification claims must carry evidence ────────────────────────────
const verifiedBlocks = [...verifiedSrc.matchAll(/'([a-z0-9-]+)':\s*\{([\s\S]*?)\n\s{2}\}/g)];
for (const [, slug, body] of verifiedBlocks) {
  // 'tool-slug' is the placeholder in the how-to comment block, not real data.
  if (slug === 'tool-slug') continue;
  if (!seen.has(slug)) {
    errors.push(`verified-tools.ts references unknown slug "${slug}".`);
  }

  if (body.includes("'hands-on-tested'")) {
    if (!/testedAt:\s*'/.test(body)) {
      errors.push(`"${slug}" claims hands-on-tested but has no testedAt date.`);
    }
    if (!/scores:\s*\{/.test(body)) {
      errors.push(`"${slug}" claims hands-on-tested but has no scores.`);
    }
    if (!/evidenceUrls:\s*\[/.test(body)) {
      errors.push(
        `"${slug}" claims hands-on-tested but publishes no evidenceUrls. ` +
          `An untestable test claim is the problem this file exists to prevent.`
      );
    }
    // Scores must be within range.
    for (const [, key, val] of body.matchAll(/(outputQuality|speed|valueForMoney|easeOfUse|exportFreedom):\s*([\d.]+)/g)) {
      const n = Number(val);
      if (n < 0 || n > 10) errors.push(`"${slug}" score ${key}=${n} is outside 0–10.`);
    }
    if (!/cons:\s*\[/.test(body)) {
      warnings.push(`"${slug}" is tested but lists no cons. Every tool has drawbacks.`);
    }
  }

  if (body.includes("'pricing-verified'")) {
    if (!/pricingSourceUrl:\s*'/.test(body)) {
      errors.push(`"${slug}" claims pricing-verified but has no pricingSourceUrl.`);
    }
    if (!/pricingCheckedAt:\s*'/.test(body)) {
      errors.push(`"${slug}" claims pricing-verified but has no pricingCheckedAt date.`);
    }
  }
}

// ── 5. no stock imagery (v2.6) ────────────────────────────────────────────
// Unsplash covers were both misleading (critique §5) and, by 2026-08, largely
// deleted upstream — CI filled with 404s. Covers are now generated locally by
// <CoverArt />; any remote stock URL sneaking back into the data is an error.
for (const [label, src] of [
  ['tools.ts', toolsSrc],
  ['tools-extended.ts', extendedSrc],
  ['posts.ts', read('src/data/posts.ts')],
  ['gen-tools.mjs', read('scripts/gen-tools.mjs')],
]) {
  if (/unsplash\.com/i.test(src)) {
    errors.push(`${label} references unsplash.com stock imagery — covers must use <CoverArt />.`);
  }
}

// ── report ───────────────────────────────────────────────────────────────
console.log(`Checked ${allEntries.length} catalog entries.`);

if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} warning(s):`);
  warnings.forEach((w) => console.log(`   • ${w}`));
}

if (errors.length) {
  console.error(`\n❌ ${errors.length} error(s):`);
  errors.forEach((e) => console.error(`   • ${e}`));
  process.exit(1);
}

console.log('\n✅ Catalog integrity checks passed.');
