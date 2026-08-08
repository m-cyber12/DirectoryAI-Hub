#!/usr/bin/env node
/**
 * ============================================================================
 * CREATOR AI HUB — AI BLOG GENERATOR (idea #3: AI blogging on autopilot)
 * ============================================================================
 * Generates one or more ready-to-merge blog posts that match the site's
 * BlogPost schema and writes them into src/data/auto-posts.ts — the ONLY file
 * automation is allowed to touch. Hand-written posts in src/data/posts.ts are
 * never edited.
 *
 * Usage:
 *   node scripts/generate-blog.mjs --topic "AI thumbnail best practices" --category "Thumbnails & CTR" --tool midjourney
 *   node scripts/generate-blog.mjs --topic "..." --count 3
 *   node scripts/generate-blog.mjs --topic "..." --dry-run      # print, don't write
 *
 * Provider (set at least one):
 *   OPENAI_API_KEY      -> uses gpt-4o-mini (default)
 *   ANTHROPIC_API_KEY   -> uses claude-3-5-haiku if OPENAI is absent
 *
 * Other env:
 *   BLOG_AI_MODEL       -> override the model name
 *   BLOG_COVER_IMAGE    -> override the default cover image URL
 * ============================================================================
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTO_POSTS_PATH = path.join(__dirname, '..', 'src', 'data', 'auto-posts.ts');

const DEFAULT_COVER =
  process.env.BLOG_COVER_IMAGE ||
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80';

// --------------------------------------------------------------------------
// Arg parsing
// --------------------------------------------------------------------------
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

// --------------------------------------------------------------------------
// LLM call (OpenAI preferred, Anthropic fallback)
// --------------------------------------------------------------------------
async function callLLM(system, user) {
  const model = process.env.BLOG_AI_MODEL;
  if (process.env.OPENAI_API_KEY) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 2400,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content;
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-haiku-latest',
        max_tokens: 2400,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.content?.[0]?.text;
  }

  throw new Error(
    'No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment.'
  );
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

function todayParts() {
  const d = new Date();
  return {
    isoDate: d.toISOString().slice(0, 10),
    date: d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  };
}

function readTimeOf(content) {
  const words = content.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

// --------------------------------------------------------------------------
// Generate one post via LLM
// --------------------------------------------------------------------------
async function generatePost(topic, category, featuredToolSlug) {
  const system =
    'You are the editorial writer for CreatorAI Hub, a directory of AI tools for video creators. ' +
    'Write practical, honest, non-hype articles in the site voice. Use markdown with a single "# " title, ' +
    'then "## " section headings. Include real, defensible claims and avoid overclaiming. ' +
    'Return ONLY a JSON object (no markdown fences) with these keys: ' +
    'title, excerpt (1-2 sentences), category, content (full markdown article, 400-700 words). ' +
    'Do NOT invent specific prices that you cannot support; prefer discussing pricing models in general terms.';

  const user = `Write one blog article.\nTopic: ${topic}\nCategory: ${
    category || 'Creator Strategy'
  }${
    featuredToolSlug ? `\nFeatured tool slug (reference it naturally): ${featuredToolSlug}` : ''
  }\n\nReturn only the JSON object.`;

  const raw = await callLLM(system, user);
  const parsed = JSON.parse(raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, ''));

  const title = String(parsed.title || topic).trim();
  const content = String(parsed.content || '').trim();
  if (!title || !content) throw new Error('Model returned an incomplete post.');

  const { isoDate, date } = todayParts();
  return {
    slug: slugify(title),
    title,
    excerpt: String(parsed.excerpt || content.slice(0, 140)).trim(),
    date,
    isoDate,
    readTime: readTimeOf(content),
    category: String(parsed.category || category || 'Creator Strategy'),
    coverImage: DEFAULT_COVER,
    featuredToolSlug: featuredToolSlug || '',
    content,
    /**
     * Critique §7 defence: machine-drafted posts start UNreviewed. They are
     * noindexed and labelled on the site until a human editor sets this to
     * true. Never flip it automatically — that is exactly the Helpful
     * Content trap this flag exists to prevent.
     */
    editoriallyReviewed: false,
  };
}

// --------------------------------------------------------------------------
// Serialize to the auto-posts.ts file
// --------------------------------------------------------------------------
function serializePost(p) {
  const q = (v) => JSON.stringify(v);
  return `  {
    slug: ${q(p.slug)},
    title: ${q(p.title)},
    excerpt: ${q(p.excerpt)},
    date: ${q(p.date)},
    isoDate: ${q(p.isoDate)},
    readTime: ${q(p.readTime)},
    category: ${q(p.category)},
    coverImage: ${q(p.coverImage)},
    featuredToolSlug: ${q(p.featuredToolSlug)},
    content: ${q(p.content)},
    editoriallyReviewed: ${p.editoriallyReviewed === true ? 'true' : 'false'},
  },`;
}

/**
 * Extract the existing object literals from an AUTO_BLOG_POSTS array body so a
 * subsequent run can preserve them verbatim. Uses a character scanner that
 * respects quoted strings, so braces inside content never confuse it.
 */
function extractExistingObjects(src) {
  const open = src.indexOf('[');
  const close = src.lastIndexOf(']');
  if (open === -1 || close === -1 || close <= open) return [];
  const body = src.slice(open + 1, close);
  const objects = [];
  let inString = false;
  let escape = false;
  let depth = 0;
  let start = -1;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        objects.push(body.slice(start, i + 1).trim());
        start = -1;
      }
    }
  }
  return objects;
}

/** Render one post block (either freshly serialized or preserved verbatim). */
function renderBlock(post) {
  if (typeof post === 'string') return post.startsWith('{') ? `  ${post.trim()},` : post;
  return serializePost(post);
}

function writeAutoPosts(posts, outPath) {
  const body = `import type { BlogPost } from '@/data/posts';

/**
 * Auto-generated blog posts (idea #3 — AI blogging on autopilot).
 *
 * GENERATED BY scripts/generate-blog.mjs. Do not edit by hand — re-run the
 * generator instead. posts.ts spreads this array in front of hand-written
 * posts so the newest generated post is featured.
 */
export const AUTO_BLOG_POSTS: BlogPost[] = [
${posts.map(renderBlock).join('\n')}
];
`;
  fs.writeFileSync(outPath, body, 'utf8');
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv);
  const topic = args.topic;
  const count = Math.min(10, Math.max(1, parseInt(args.count, 10) || 1));
  const outPath = args.out || AUTO_POSTS_PATH;
  const dryRun = !!args['dry-run'];

  if (!topic) {
    console.error('❌ Missing --topic. Example:');
    console.error('   node scripts/generate-blog.mjs --topic "AI thumbnail best practices" --category "Thumbnails & CTR" --tool midjourney');
    process.exit(1);
  }

  // Preserve any existing auto-posts when appending a fresh batch.
  let existing = [];
  if (!dryRun && fs.existsSync(outPath)) {
    try {
      const prev = fs.readFileSync(outPath, 'utf8');
      existing = extractExistingObjects(prev);
    } catch {
      // ignore malformed existing file — start fresh
    }
  }

  console.log(`🤖 Generating ${count} blog post${count > 1 ? 's' : ''} for topic: ${topic}`);
  const generated = [];
  const seenSlugs = new Set();
  for (let i = 0; i < count; i++) {
    const post = await generatePost(topic, args.category, args.tool);
    if (seenSlugs.has(post.slug)) {
      post.slug = `${post.slug}-${i + 1}`;
    }
    seenSlugs.add(post.slug);
    generated.push(post);
    console.log(`   ✓ ${post.slug} — ${post.title}`);
  }

  // New posts go in front so the newest is featured.
  const merged = [...generated, ...existing];

  if (dryRun) {
    console.log('\n--- Dry run: generated post(s) below (not written) ---\n');
    console.log(generated.map(serializePost).join('\n'));
    console.log('\nTo write to file, drop --dry-run.');
    return;
  }

  writeAutoPosts(merged, outPath);
  console.log(`\n✅ Wrote ${merged.length} auto-post(s) to ${path.relative(process.cwd(), outPath)}`);
  console.log('Run `npm run verify` to typecheck/lint, then review and commit.');
}

main().catch((err) => {
  console.error('❌ Generation failed:', err.message);
  process.exit(1);
});
