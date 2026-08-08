# ROADMAP — What code alone cannot fix / نقشهٔ راه: کارهایی که فقط با کد حل نمی‌شوند

Everything in this file was **intentionally left to you** during the v2 remediation, because each
item requires real-world action (money, accounts, physical testing) rather than code. Items are in
priority order per the critique (`CRITIQUE_DirectoryAI_Hub.md` §12).

---

## 🔥 Phase 1 — Survival (week 1-2) / فاز ۱ — بقا

### 1. Run 10 real hands-on tests (THE moat) / تست واقعی ۱۰ ابزار
The entire site is built for this moment. Nothing is fabricated — the moment you add a record to
`src/data/verified-tools.ts` with `testedAt`, `scores`, `evidenceUrls` and `pros/cons`:
- the Evidence Card, score radar and Review schema switch on for that tool,
- "Tested only" filter stops being empty,
- homepage stat "0 evidence packs" updates,
- CI validates your claim (it fails the build if evidence is missing — that is the point).

Suggested first ten (most searched): **OpusClip, ElevenLabs, Descript, CapCut, Runway, Submagic,
VEED, HeyGen, Synthesia, InVideo.** Use the 24-point brief at `/benchmark`. Publish the artefacts
(screenshots/output files) somewhere public and link them as `evidenceUrls`.

### 2. Custom domain / دامنهٔ اختصاصی
`creatorsaicenter.vercel.app` scores zero domain authority and the email derived from it looks
unprofessional. Buy e.g. `creatorai.tools` or `creatoraihub.com`, then:
1. Add the domain in Vercel → DNS.
2. Set `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` — **that is the only code-side change**;
   canonicals, sitemap, schema, contact email and the public API all derive from it
   (`src/config/site.ts`).
3. Consider renaming the GitHub repo to match (repo name currently says "DirectoryAI-Hub",
   the site says "CreatorAI Hub").

### 3. Join real affiliate programs / دریافت افیلیت واقعی
The plumbing is ready (`affiliateProgram` field → `/go/[slug]` redirect → `rel="sponsored"` →
auto-updating `/disclosure`). Start with programs you can actually get approved for:
ElevenLabs (first/impact), Descript, Pictory, InVideo, Synthesia, murf, VEED. For each approval:
set the tool's `affiliateUrl` to your real tracked link and `affiliateProgram` accordingly.
**Never guess tracking parameters** — that was audit violation 1.6.

### 4. Approve news / تأیید اخبار
With Supabase configured + migration 0006 run, the cron feeds the **admin → News Queue** tab.
Approve the items worth showing; everything else stays invisible. Until Supabase is configured,
`/news` serves the hand-written curated fallback.

---

## ⭐ Phase 2 — Foundation (weeks 3-6) / فاز ۲ — پایه

- **Price tracking**: whenever you re-check a vendor price, run
  `node scripts/record-price.mjs <slug> "$15/mo" <pricing-url>` — the tool page chart builds
  itself from the second point onward (critique §11-7 killer feature).
- **More deep dives**: `src/data/tool-deep-dives.ts` has 12 flagship entries; add one whenever
  you research a tool properly (overview, use cases, bestFor, mandatory avoidIf, FAQ).
- **Newsletter live delivery**: the double-opt-in machinery exists; connect an ESP
  (Resend/Buttondown) and the briefing can actually ship.
- **Grow the catalog honestly**: ~10 verified tools/week beats 1,000 scraped ones. Template for
  additions: real domain (curl-checked), conservative facts, no price if unsure.

## 🟡 Phase 3 — Growth (months 2-3) / فاز ۳ — رشد

- Chrome extension ("View on CreatorAI Hub + best alternative" on vendor sites).
- Tool-submission review workflow polish (submission → tested → badge).
- "I use this" + server-side bookmarks/accounts for real social proof.
- Price alerts (email subscribers when `price_history` gets a new point).
- Leaderboards from real click/compare events (the tables exist: `click_log`, `search_log`).
- Multi-language content (fa/ar) — the MENA creator market is underserved.

## 💡 Phase 4 — Differentiation (months 4-6) / فاز ۴ — تمایز

- AI recommender chat (the `ToolRecommenderModal` quiz is the seed — wire it to an LLM with the
  catalog as context).
- Community benchmark playground (users upload evidence packs).
- Vendor dashboards (click analytics on their listing).
- Quarterly "State of AI Video Tools" trend report — lead magnet + backlink engine.

---

## 🧭 Operating rules that keep the 10/10 / قوانینی که نمرهٔ ۱۰ را نگه می‌دارند

1. **Never publish a number without a source** — scores need evidence packs, prices need source
   URLs + dates, news needs the approval click. CI encodes most of this; habit encodes the rest.
2. **Every claim must survive the question "how would a regulator verify this?"**
3. **`npm run verify` before every push** — typecheck + lint + data integrity + unit tests.
4. **Watch the E2E workflow** — the fake-promo-code test exists because it happened once already.
5. **Honest empty states beat fake fullness.** "0 evidence packs — here is the queue" converts
   better than invented stars; the whole brand is that sentence.
