# CreatorAI Hub

A specialist directory of AI tools for video creators — YouTubers, editors, podcasters and
short-form creators — built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS** and
**Supabase**.

> **v2 remediation (2026-08-04)** — the full response to the critique review is documented in
> [`CHANGES-2026-08-04-v2.md`](./CHANGES-2026-08-04-v2.md): integrity fixes (fake promo codes
> removed, fabricated blog claims rewritten), a scored news-relevance gate + editorial approval
> queue, 4 new categories and 9 new verified tools, tool-page deep dives + FAQ schema, combined
> faceted filters, Stack Builder v2 with shareable stacks, price-history tracking, and full
> unit + E2E test coverage. What still needs a human: [`ROADMAP.md`](./ROADMAP.md).

> **Cinematic v2** — the homepage is now an interactive 3D experience (neural-mesh hero with
> scroll dive, Lenis + GSAP scroll choreography, tilt/glare cards). See
> [`CINEMATIC_V2.md`](./CINEMATIC_V2.md) for the full rundown and tuning guide.

> **Read [`DEPLOYMENT.md`](./DEPLOYMENT.md) before pushing.** There is a security migration that
> must be run in Supabase, and a required environment variable, or writes will silently stop.

---

## The core idea

Most AI directories claim every listing is "independently reviewed". It is almost never true, and
it is why their ratings are worthless — when every tool scores 4.5 stars, the score carries no
information.

This site uses three explicit verification levels, shown on every listing:

| Level | What it means | Gets a score? |
|---|---|---|
| `hands-on-tested` | We ran it ourselves on the standard brief and published the output | ✅ Yes |
| `pricing-verified` | A human confirmed the price on the vendor's page, on a stated date | ❌ No |
| `listed-only` | Catalogued from public information. No test claim | ❌ No |

A tool can only earn a level above `listed-only` by having a hand-written record in
[`src/data/verified-tools.ts`](./src/data/verified-tools.ts). It is deliberately impossible to
fake a test claim by editing a machine-generated data file, and CI rejects any `hands-on-tested`
entry lacking a test date, scores or published evidence.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # everything is optional for local dev
npm run dev
```

The site builds and runs with **no** environment variables — it falls back to the static catalog.

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run verify` | **typecheck + lint + data integrity + unit tests** — run before pushing |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint including `jsx-a11y` |
| `npm run validate:data` | Catalog integrity (duplicate slugs, dead hosts, unbacked claims) |
| `npm run test` | Vitest unit suite (filters, search, FAQ honesty, news relevance) |
| `npm run test:e2e` | Playwright smoke suite against the production build |
| `npm run format` | Prettier |

---

## Architecture

```
src/
├─ config/site.ts          Single source of truth for URL, name, contact
├─ data/
│  ├─ tools.ts             Type definitions + 45 hand-written tools (17 categories)
│  ├─ tools-extended.ts    161 generated tools (edit the seed in scripts/gen-tools.mjs)
│  ├─ verified-tools.ts    ⭐ The evidence registry — the only place a claim is granted
│  ├─ tool-deep-dives.ts   Hand-written flagship deep dives + custom FAQ entries
│  └─ graveyard.ts         Dead tools; auto-excluded from the live catalog
├─ lib/
│  ├─ toolFilters.ts       Pure filter/sort + faceted tags/verification (unit-tested)
│  ├─ search.ts            Weighted fuzzy search with synonyms + intent extraction
│  ├─ toolFaq.ts           Honest auto-FAQ per tool (unit-tested)
│  ├─ newsRelevance.ts     Scored topical gate for /news (unit-tested)
│  ├─ categories.ts        Category slugs + hand-written editorial copy
│  ├─ comparisons.ts       Curated "X vs Y" pairs (not exhaustive — avoids doorway pages)
│  ├─ supabase.ts          Public client (reads only)
│  ├─ supabaseAdmin.ts     🔒 Service-role client, server-only (all writes)
│  ├─ adminAuth.ts         HMAC-signed admin sessions + CSRF
│  └─ rateLimit.ts         Upstash-backed with in-memory fallback
└─ app/
   ├─ tools/               Server-rendered catalog + faceted filter island
   ├─ tool/[slug]/         206 tool pages: deep dives, FAQ+schema, price history, OG images
   ├─ category/[slug]/     17 category guides
   ├─ alternatives/[slug]/ 206 "best alternatives" pages
   ├─ compare/[pair]/      Curated head-to-head pages incl. cross-category picks
   ├─ stack-builder/       Interactive workflow planner with shareable URLs
   ├─ badge/[slug]/        Embeddable SVG badge (backlink engine)
   ├─ admin/               Submissions, reviews, NEWS QUEUE, announcement
   └─ api/cron/link-health Weekly dead-link detection
```

### Data flow

`ALL_TOOLS` is the single catalog used everywhere. It merges the two seed arrays, drops anything
in the graveyard, and applies verification from `verified-tools.ts`. Nothing else grants trust.

---

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. SQL Editor → run the migrations **in order**:

```
supabase/migrations/
├─ 0001_initial_schema.sql     tools, submissions
├─ 0002_site_settings.sql      site_settings
├─ 0002b_launch_upgrade.sql    reviews, bookmarks, newsletter, click_log
├─ 0003_lock_down_rls.sql      ⚠️ SECURITY — revokes anon write access
├─ 0004_launch_features.sql    link_health, search_log, price_history, double opt-in
├─ 0005_news_items.sql         news snapshot storage
└─ 0006_news_editorial_gate.sql approved flag → admin review queue for /news
```

3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (see `.env.example`)

**Migration 0003 is not optional.** Without it the anon key — which is public in the browser
bundle — can rewrite your site copy and self-approve reviews. Details in `DEPLOYMENT.md`.

---

## Weekly link health

`/api/cron/link-health` checks all 197 outbound links every Monday (scheduled in `vercel.json`)
and records results in `link_health`. Three consecutive failures flag a tool for review; confirmed
shutdowns move to `src/data/graveyard.ts`, which removes them from the catalog automatically.

Run it manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron/link-health
```

---

## Adding a tool

1. Add the entry to `src/data/tools.ts` (typed as `ToolSeed` — it cannot declare its own
   verification level)
2. Run `npm run validate:data`
3. To grant a verification level, add a record to `src/data/verified-tools.ts`

## Testing a tool (the important workflow)

1. Run it against the standard brief for its category — see `/benchmark`
2. Capture evidence: screenshot, exported file, or clip. Upload and link it
3. Score each dimension 0–10 honestly, using the full range
4. Fill **both** `pros` and `cons` — every tool has drawbacks
5. Add the record to `verified-tools.ts` with `verificationLevel: 'hands-on-tested'`

CI fails if you claim a test without a date, scores and evidence.

---

## Solo-founder automation (the three idea playbook)

This repo ships the three "zero-investment, automated, single-person" ideas as
real features:

| Idea | Feature | Where |
|---|---|---|
| #1 Comparison & review (affiliate SEO) | Ranked **"Best of 2026"** lists per category with editorial picks + affiliate CTAs | `/best-of` → [`src/app/best-of/page.tsx`](./src/app/best-of/page.tsx) |
| #3 AI blogging on autopilot | **Blog generator** CLI + scheduled GitHub Action that drafts a post and opens a PR | [`scripts/generate-blog.mjs`](./scripts/generate-blog.mjs) · [`src/data/auto-posts.ts`](./src/data/auto-posts.ts) · `.github/workflows/blog-generate.yml` |
| #13 AI news aggregator | **Auto-refresh** RSS ingest → optional AI summaries → persisted snapshot served at `/news` | `/news` + `/news/[slug]` · `src/lib/news.ts` · [`src/app/api/news/refresh/route.ts`](./src/app/api/news/refresh/route.ts) · `supabase/migrations/0005_news_items.sql` |

### Auto-generate a blog post

```bash
export OPENAI_API_KEY=sk-...            # or ANTHROPIC_API_KEY
npm run generate:blog -- --topic "Best AI thumbnail tools" --category "Thumbnails & CTR" --tool midjourney
```

Writes a schema-matching post into `src/data/auto-posts.ts` (never touches the
hand-written `src/data/posts.ts`). Run `npm run verify` before committing.

### Refresh the news feed

The `/api/news/refresh` endpoint is scheduled daily in `vercel.json` (Hobby-plan safe); the admin panel has an "Ingest now" button for on-demand refreshes.
It needs `CRON_SECRET` (auth) and, to persist, `SUPABASE_SERVICE_ROLE_KEY`.
Add `OPENAI_API_KEY` to enable AI summaries. Run `supabase/migrations/0005_news_items.sql`
first. Add new sources in [`src/data/news-sources.ts`](./src/data/news-sources.ts).

## Tech notes

- **206 tool pages, 17 categories, 206 alternatives, curated comparisons** — all statically
  generated (1020 pages at the v2 build)
- **Tests**: Vitest unit suite (`tests/`) + Playwright E2E (`e2e/`), both wired into CI
- **News pipeline**: relevance-scored gate → persisted pending items → admin approval → /news
- **Price tracking**: `scripts/record-price.mjs` → `price_history` → tool-page sparkline
- **Fonts** self-hosted via `next/font` (Inter + JetBrains Mono for tabular figures)
- **No text below 12px** anywhere — the type scale enforces it (v2 swept the last violations)
- **Error boundaries** (`error.tsx`, `global-error.tsx`) keep a crashing page from killing the app
- **Security headers** (CSP, HSTS, X-Frame-Options…) in `next.config.js`
- **Analytics** via `@vercel/analytics` — cookieless, no consent required
- `/feed.xml`, `/feed-tools.xml`, `/llms.txt`, `/manifest.webmanifest` for RSS, AI crawlers and PWA

## 🌐 Internationalization (8 languages)

The site ships in **8 languages**: English (default, at `/`), Spanish `/es`, Portuguese `/pt`, French `/fr`, German `/de`, Simplified Chinese `/zh`, Arabic `/ar` and Persian/Farsi `/fa`. Arabic and Persian render right-to-left with native typefaces (Vazirmatn, Noto Sans Arabic, Noto Sans SC, Inter).

**Professional translation engine, not Google Translate.** Content is translated by an LLM-based localization engine (`src/lib/i18n/engine.ts`) with a domain glossary, brand-name protection and tone preservation — including Persian, which DeepL does not support.

**New content is translated automatically** three ways:
1. `/api/cron/translate` — daily incremental sync (Vercel cron, needs `CRON_SECRET`)
2. `.github/workflows/translate.yml` — daily GitHub Action that also commits snapshot JSON (`src/i18n-content/*.json`) so all locales work even on Vercel Hobby with no database
3. `/api/news/refresh` — freshly ingested news is translated immediately

**Already seeded — the whole catalog is translated.** All 206 tools, all 17
categories (and for fa/es/pt also the 65 news items + 10 blog posts) ship with
hand-written professional translations in `src/i18n-content/{locale}.json`
(source: `scripts/seed-data/`). Nothing is needed to make the non-English
locales work — the auto-translate engine only tops up *new* content.

**Optional engine setup** (for new content that arrives later):
```
OPENAI_API_KEY=gpt-4o-mini   # the translation engine
SUPABASE_SERVICE_ROLE_KEY    # optional: persistent translation cache
```

**Commands:**
```bash
npm run translate:content     # translate all pending content (DB + snapshot)
npm run translate:ui          # sync UI dictionaries from messages/en.json
npm run translate:status      # coverage report per locale
node scripts/check-keys.mjs   # validate that all UI keys exist in every locale
```

Full details (in Persian): see [`I18N-SETUP-FA.md`](./I18N-SETUP-FA.md). DB migration: `supabase/migrations/0013_i18n_translations.sql`.
