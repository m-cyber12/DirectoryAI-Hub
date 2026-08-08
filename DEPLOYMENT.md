# Deployment & Post-Merge Checklist

Read this before pushing. Two steps **must** happen or things will break.

---

## ⚠️ 1. Run the security migration (do this first)

`supabase/migrations/0003_lock_down_rls.sql` closes a real vulnerability.

**What was wrong:** `site-settings.sql` shipped these policies:

```sql
CREATE POLICY "Anyone can update site settings"
  ON public.site_settings FOR UPDATE USING (true);
```

The anon key is public — it ships inside the browser bundle. Any visitor could
rewrite your hero text, announcement banner or footer to spam or malware links
from the browser console. The same `USING (true)` pattern let anyone insert
reviews with `status: 'approved'` (bypassing moderation *and* the rate limit),
flood `click_log` to burn your Supabase quota, and spam the newsletter table.

**Do this:**

1. Supabase dashboard → SQL Editor
2. Run `supabase/migrations/0003_lock_down_rls.sql`
3. Run `supabase/migrations/0004_launch_features.sql`
4. Run `supabase/migrations/0005_news_items.sql` (news storage)
5. Run `supabase/migrations/0006_news_editorial_gate.sql` (news review queue —
   nothing reaches `/news` without an admin approval click)
6. Verify — every row should be `SELECT`-only for anon/authenticated:

```sql
select tablename, policyname, cmd, roles
from pg_policies where schemaname = 'public' order by tablename, cmd;
```

## ⚠️ 2. Set `SUPABASE_SERVICE_ROLE_KEY`

Because step 1 revokes anon writes, **every write now needs the service role
key**. Without it, reviews, submissions, newsletter signups and click logging
stop working silently.

Vercel → Settings → Environment Variables:

| Variable | Where to find it | Required |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` | **Yes**, if using Supabase |
| `SUPABASE_URL` | Same page | **Yes**, if using Supabase |
| `ADMIN_SESSION_SECRET` | `openssl rand -hex 32` | **Yes**, for `/admin` |
| `CRON_SECRET` | `openssl rand -hex 32` | Yes, for link-health cron |
| `NEXT_PUBLIC_SITE_URL` | Your domain | Recommended |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Upstash free tier | Recommended |

> 🚨 `SUPABASE_SERVICE_ROLE_KEY` must **never** have a `NEXT_PUBLIC_` prefix.
> The build fails loudly if it is imported into client code (`server-only`).

See `.env.example` for the fully commented list.

---

## 3. Delete the test review

A live test review is still in your database:

```
GET /api/reviews?tool=opusclip
→ "Launch verification — Automated launch verification review, safe to delete"
```

Remove it from `/admin` → Reviews, or:

```sql
delete from public.reviews where title = 'Launch verification';
```

---

## 4. Verify locally before pushing

```bash
npm install        # includes v2 deps: vitest, @playwright/test (dev)
npm run verify     # typecheck + lint + data integrity + 25 unit tests
npm run build
npm run test:e2e   # optional: 12 browser smoke tests (needs a build first)
```

All must pass. `npm run verify` and the Playwright suite both run in CI on
every push (`.github/workflows/ci.yml`, `.github/workflows/e2e.yml`).

---

## 4b. Operating the news review queue (migration 0006)

The auto-refresh cron no longer auto-publishes:

1. Cron (or `GET /api/news/refresh` with the `CRON_SECRET`) ingests the RSS
   sources, applies the scored relevance gate (`src/lib/newsRelevance.ts`),
   and inserts survivors with `approved = false`.
2. Open `/admin` → **News Queue** — approve what deserves to appear; reject
   deletes the item permanently.
3. `/news` serves only approved items, and the relevance gate re-checks them
   at read time as defence in depth.

Without Supabase the page falls back to the hand-written curated briefing.

## 4c. Recording price history (critique §11-7)

Whenever you re-verify a vendor price, log the data point:

```bash
node scripts/record-price.mjs opusclip "$15/mo" "https://www.opus.pro/pricing"
```

Tool pages chart every recorded point from the second one onward
(`/api/v1/tools/<slug>/price-history`). Until a point exists the page shows an
honest "tracking is new for this tool" note — never a synthetic chart.
Also remember to update the matching record in `src/data/verified-tools.ts`.

## 4c. Optional: faster news refreshes via cron-job.org (Hobby-friendly)

Vercel Hobby only allows **one cron per day**, so the built-in `vercel.json`
schedule runs daily at 06:17. If you want fresher news (e.g. every 6 hours)
without upgrading, use the free external scheduler [cron-job.org](https://cron-job.org):

1. Create a job with your endpoint:
   `https://YOUR-DOMAIN/api/news/refresh`
2. Method: **GET**
3. Header: `Authorization: Bearer <your CRON_SECRET>` (the same value you set
   in Vercel env vars — the endpoint rejects anything else with 401).
4. Schedule: every 6 hours (or anything ≥ 5 minutes; ingestion is idempotent —
   duplicate slugs are ignored and approved items are never overwritten, so
   running it often is harmless).
5. Enable “record response” for the first week so you can see the
   `{ fetched, kept, insertedNew }` JSON in the job log.

You can keep the daily Vercel cron as a backup — the two coexist safely. And
remember the admin panel’s **Ingest now** button remains the zero-setup option.

---

## 5. After deploying

- [ ] Submit `/sitemap.xml` in Google Search Console **and** Bing Webmaster Tools
- [ ] Confirm security headers: `curl -sI https://yourdomain.com | grep -i content-security`
- [ ] Confirm `/tools` is server-rendered: `curl -s https://yourdomain.com/tools | grep -c OpusClip` → should be > 0
- [ ] Test the cron manually:
      `curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron/link-health`
- [ ] Check `/disclosure` reflects reality (it auto-detects whether you have affiliate programs)

---

## What still needs *you*, not code

These were flagged in the audit and cannot be fixed by refactoring:

### Start the testing programme
`src/data/verified-tools.ts` is the only place a tool can earn a score. It is
intentionally almost empty — populating it with invented data would recreate
the exact violation this work removed.

The plumbing is finished and proven: Evidence Card, score breakdown, "Tested
only" filter, `Review` structured data and the badge all activate the moment
you add your first real entry. Follow the template in that file.

**Suggested first ten:** `opusclip`, `descript`, `elevenlabs`, `runway`,
`heygen`, `submagic`, `capcut`, `veed`, `vizard`, `klap`.

Ten genuinely tested tools beat two hundred claimed ones.

### Affiliate programs
`affiliateUrl` values were guessed patterns (`?via=creatoraihub`) for programs
never joined — they earned nothing while the footer claimed a relationship.
Outbound links now ignore `affiliateUrl` unless `affiliateProgram` is set.

Once approved by Impact / PartnerStack / a direct program, set both fields.
`/disclosure` and the `rel="sponsored"` attribute update automatically.

### Custom domain
`vercel.app` caps your trust and SEO ceiling. Buy the domain, set
`NEXT_PUBLIC_SITE_URL`, and 301 the old host. Everything else follows from
that one variable.

### Newsletter ESP
Double opt-in is implemented (token, confirm endpoint, unsubscribe), but
nothing sends the email yet. Wire up Resend/Loops/Beehiiv where marked in
`src/app/api/newsletter/route.ts`.

### The known trade-off: submissions vs. static pages
Tool pages use `generateStaticParams` with `dynamicParams = false`, so a tool
approved in `/admin` has **no live page** until it is added to
`src/data/tools.ts` and redeployed. The admin panel now says this explicitly
rather than pretending otherwise.

This was left deliberately: static generation is why 197 tool pages, 197
alternatives pages and 115 comparison pages are instant and free to serve.
Switching to `dynamicParams = true` with ISR would fix the submission flow but
make every page a runtime render. Given submissions are low-volume and need
manual review anyway, adding them to the data file during review is the better
trade — but the choice is now visible instead of hidden.
