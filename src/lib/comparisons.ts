import { ALL_TOOLS, type Tool } from '@/data/tools';
import { rankValue } from '@/lib/ranking';

/**
 * Curated "X vs Y" comparison pairs (audit fix 3.1).
 *
 * "<tool a> vs <tool b>" is extremely high-intent search traffic and the site
 * had no page for it. The audit suggests 300+ pairs, but generating every
 * combination produces thin duplicate pages — a doorway-page risk it also
 * warns about. So pairs are generated under strict rules:
 *
 *   - both tools in the same category (comparing a thumbnail maker to a
 *     transcription tool helps nobody)
 *   - both reasonably prominent, so the page answers a question people ask
 *   - capped per category, ranked by combined prominence
 *   - deterministic ordering, so URLs are stable between builds
 *
 * That yields a focused set of genuinely useful pages instead of hundreds of
 * near-empty ones.
 */

const MAX_PAIRS_PER_CATEGORY = 12;
/**
 * Audit fix 2.4 follow-up — pair *existence* is an editorial/content decision,
 * and the honest rank only decides which pairs get kept within the cap. To
 * avoid flooding the site with thin pages, only tools that are at least
 * pricing-verified OR editorially flagged (featured / editors-choice) are
 * auto-paired. Hand-picked pairs that people actually search for (even between
 * listed-only tools) live in EXTRA_PAIRS below.
 */
const MIN_PROMINENCE = 3;

/**
 * Hand-picked cross-category pairs people genuinely search for, where the
 * same-category rule would miss a real decision (e.g. "how do I translate my
 * videos" — dubbing suite vs avatar platform). Both slugs must exist in the
 * catalog; unknown slugs are skipped so a rename can never break the build.
 */
const EXTRA_PAIRS: [string, string][] = [
  ['heygen', 'rask-ai'], // avatar translation vs dedicated dubbing suite
  // Popular same-category decisions that people genuinely search for but that
  // don't surface in the auto-pairing (one of the two is listed-only).
  ['elevenlabs', 'murf-ai'], // premium voice cloning vs affordable 120-voice studio
];

function prominence(t: Tool): number {
  // Honest prominence (audit fix 2.4): verification level + editorial flags
  // only. Fabricated rating/reviewsCount/isTrending no longer rank anything.
  return rankValue(t);
}

function buildPairs(): [string, string][] {
  const byCategory = new Map<string, Tool[]>();
  for (const t of ALL_TOOLS) {
    if (prominence(t) < MIN_PROMINENCE) continue;
    const list = byCategory.get(t.category) ?? [];
    list.push(t);
    byCategory.set(t.category, list);
  }

  const pairs: [string, string][] = [];

  for (const tools of byCategory.values()) {
    const ranked = [...tools].sort((a, b) => {
      const d = prominence(b) - prominence(a);
      return d !== 0 ? d : a.slug.localeCompare(b.slug);
    });

    const candidates: { pair: [string, string]; weight: number }[] = [];
    for (let i = 0; i < ranked.length; i++) {
      for (let j = i + 1; j < ranked.length; j++) {
        // Alphabetical slug order keeps each URL canonical and stable.
        const [a, b] =
          ranked[i].slug < ranked[j].slug
            ? [ranked[i].slug, ranked[j].slug]
            : [ranked[j].slug, ranked[i].slug];
        candidates.push({
          pair: [a, b],
          weight: prominence(ranked[i]) + prominence(ranked[j]),
        });
      }
    }

    candidates
      .sort((x, y) => y.weight - x.weight || x.pair[0].localeCompare(y.pair[0]))
      .slice(0, MAX_PAIRS_PER_CATEGORY)
      .forEach((c) => pairs.push(c.pair));
  }

  // Curated cross-category pairs (both slugs must exist in the catalog).
  for (const [x, y] of EXTRA_PAIRS) {
    if (!ALL_TOOLS.some((t) => t.slug === x) || !ALL_TOOLS.some((t) => t.slug === y)) continue;
    const [a, b] = x < y ? [x, y] : [y, x];
    if (!pairs.some(([pa, pb]) => pa === a && pb === b)) pairs.push([a, b]);
  }

  // Stable global ordering.
  return pairs.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
}

export const COMPARISON_PAIRS: [string, string][] = buildPairs();

/** Parse "a-vs-b" back into two tools, tolerating slugs that contain "-vs-". */
export function parseComparisonSlug(slug: string): { a: Tool; b: Tool } | null {
  const idx = slug.indexOf('-vs-');
  if (idx === -1) return null;

  // Try every split point in case a slug legitimately contains "-vs-".
  let search = idx;
  while (search !== -1) {
    const aSlug = slug.slice(0, search);
    const bSlug = slug.slice(search + 4);
    const a = ALL_TOOLS.find((t) => t.slug === aSlug);
    const b = ALL_TOOLS.find((t) => t.slug === bSlug);
    if (a && b) return { a, b };
    search = slug.indexOf('-vs-', search + 1);
  }
  return null;
}
