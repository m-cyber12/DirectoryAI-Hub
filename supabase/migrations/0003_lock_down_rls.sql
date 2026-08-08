-- ════════════════════════════════════════════════════════════════════════
--  0003 — LOCK DOWN ROW LEVEL SECURITY   ⚠️ SECURITY FIX — RUN THIS FIRST
-- ════════════════════════════════════════════════════════════════════════
--
-- Audit fix 1.3. Run this in the Supabase SQL editor BEFORE the next deploy.
--
-- THE PROBLEM
-- The original site-settings.sql and supabase-launch-upgrade.sql granted
-- write access to the `anon` role with USING (true) / WITH CHECK (true).
-- The anon key is public — it ships inside the browser bundle — so any
-- visitor could, with three lines in the dev console:
--
--   * rewrite hero_title_main / announcement_title / footer_copyright to
--     spam, phishing or malware links (site_settings UPDATE + INSERT)
--   * insert reviews directly with status = 'approved', bypassing both the
--     API rate limit and moderation entirely
--   * insert millions of rows into click_log, destroying the analytics and
--     burning the Supabase free-tier quota
--   * spam newsletter_subscribers with arbitrary addresses
--
-- THE FIX
-- Revoke ALL anon writes. Public SELECT stays where it belongs (approved
-- reviews, site settings, approved tools). Every write now flows through a
-- Next.js API route using the service role key (src/lib/supabaseAdmin.ts),
-- where validation, rate limiting and moderation actually run.
--
-- After running this you MUST set SUPABASE_SERVICE_ROLE_KEY in Vercel →
-- Settings → Environment Variables, or writes will silently stop working.
-- ════════════════════════════════════════════════════════════════════════

begin;

-- ── site_settings ──────────────────────────────────────────────────────
-- Was world-writable. This was the most severe issue: public defacement.
drop policy if exists "Anyone can update site settings" on public.site_settings;
drop policy if exists "Anyone can insert site settings" on public.site_settings;
drop policy if exists "Public site settings are viewable by everyone" on public.site_settings;

alter table if exists public.site_settings enable row level security;

create policy "site settings are publicly readable"
  on public.site_settings for select
  to anon, authenticated
  using (true);
-- No INSERT/UPDATE/DELETE policy => anon and authenticated cannot write.
-- The service role bypasses RLS, so the admin API still works.

-- ── reviews ────────────────────────────────────────────────────────────
-- Direct inserts let users self-approve reviews and skip rate limiting.
drop policy if exists "anyone can insert reviews" on public.reviews;
drop policy if exists "reviews are readable by everyone" on public.reviews;

alter table if exists public.reviews enable row level security;

create policy "approved reviews are publicly readable"
  on public.reviews for select
  to anon, authenticated
  using (status = 'approved');

-- Defence in depth: even if a write policy is ever re-added by mistake,
-- a review can never be born approved.
alter table if exists public.reviews
  alter column status set default 'pending';

-- ── click_log ──────────────────────────────────────────────────────────
-- Was open to unlimited anonymous inserts (quota + analytics poisoning).
drop policy if exists "anyone can log clicks" on public.click_log;
drop policy if exists "Anyone can insert click log" on public.click_log;

alter table if exists public.click_log enable row level security;
-- Intentionally no anon policy at all: clicks are recorded server-side by
-- /go/[slug] using the service role. Nothing legitimate reads this publicly.

-- ── newsletter_subscribers ─────────────────────────────────────────────
-- Was open to email spam injection.
drop policy if exists "anyone can subscribe" on public.newsletter_subscribers;
drop policy if exists "Anyone can subscribe" on public.newsletter_subscribers;

alter table if exists public.newsletter_subscribers enable row level security;
-- Subscriptions go through /api/newsletter (validation + rate limit +
-- double opt-in token). No public read: the subscriber list must never leak.

-- ── submissions ────────────────────────────────────────────────────────
-- Public submission is a legitimate product feature, but it should carry
-- validation and rate limiting, so route it through the API too.
drop policy if exists "Anyone can insert a tool submission" on public.submissions;

alter table if exists public.submissions enable row level security;

-- ── tools ──────────────────────────────────────────────────────────────
-- Read-only for the public; only approved rows are visible.
drop policy if exists "Public tools are viewable by everyone" on public.tools;

alter table if exists public.tools enable row level security;

create policy "approved tools are publicly readable"
  on public.tools for select
  to anon, authenticated
  using (status = 'approved');

-- ── user_bookmarks ─────────────────────────────────────────────────────
-- This one was already correct — users manage only their own row. Kept and
-- restated so the full security posture lives in a single reviewable file.
drop policy if exists "users manage own bookmarks" on public.user_bookmarks;

alter table if exists public.user_bookmarks enable row level security;

create policy "users manage own bookmarks"
  on public.user_bookmarks for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── belt and braces ────────────────────────────────────────────────────
-- Explicitly strip table-level write grants from the public roles, in case
-- any were handed out directly rather than through RLS.
revoke insert, update, delete on public.site_settings           from anon, authenticated;
revoke insert, update, delete on public.reviews                 from anon, authenticated;
revoke insert, update, delete on public.click_log               from anon, authenticated;
revoke insert, update, delete on public.newsletter_subscribers  from anon, authenticated;
revoke insert, update, delete on public.submissions             from anon, authenticated;
revoke insert, update, delete on public.tools                   from anon, authenticated;
revoke select                 on public.newsletter_subscribers  from anon, authenticated;
revoke select                 on public.click_log               from anon, authenticated;

commit;

-- ── verify ─────────────────────────────────────────────────────────────
-- Every row returned should be SELECT-only. Any INSERT/UPDATE/DELETE row
-- for anon or authenticated means something above did not apply.
--
--   select tablename, policyname, cmd, roles
--   from pg_policies
--   where schemaname = 'public'
--   order by tablename, cmd;
