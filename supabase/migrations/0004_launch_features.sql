-- ════════════════════════════════════════════════════════════════════════
--  0004 — LAUNCH FEATURES
--  link health monitoring · search logging · price history · double opt-in
-- ════════════════════════════════════════════════════════════════════════
-- Run after 0003_lock_down_rls.sql.

begin;

-- ── link_health ────────────────────────────────────────────────────────
-- Audit fix 1.5. Twelve outbound links were broken at audit time, mostly
-- because the generator prefixed every domain with "www." — which does not
-- exist for most .ai domains. A weekly cron now checks all of them so dead
-- links are found by us, not by readers.
create table if not exists public.link_health (
  id           bigserial primary key,
  tool_slug    text        not null,
  url          text        not null,
  status_code  int         not null default 0,
  final_url    text,
  ok           boolean     not null default false,
  error        text,
  checked_at   timestamptz not null default now()
);
create index if not exists link_health_slug_idx    on public.link_health (tool_slug, checked_at desc);
create index if not exists link_health_broken_idx  on public.link_health (ok, checked_at desc) where ok = false;

alter table public.link_health enable row level security;
-- Server-side only (cron writes, admin reads). No public policy.

-- Consecutive failures per tool — three strikes and it goes to the graveyard.
create or replace view public.link_health_latest as
select distinct on (tool_slug)
  tool_slug, url, status_code, final_url, ok, error, checked_at
from public.link_health
order by tool_slug, checked_at desc;

-- ── search_log ─────────────────────────────────────────────────────────
-- Audit fix 4.5. Nothing was recorded about what visitors searched for —
-- for a directory that is the single most valuable dataset you can own. It
-- tells you which tools to add, which to test next, and what to write about.
create table if not exists public.search_log (
  id           bigserial primary key,
  query        text        not null,
  results      int         not null default 0,
  category     text,
  created_at   timestamptz not null default now()
);
create index if not exists search_log_created_idx on public.search_log (created_at desc);
create index if not exists search_log_query_idx   on public.search_log (lower(query));

alter table public.search_log enable row level security;

-- Powers the public "most searched" module and your content roadmap.
create or replace view public.search_trends as
select
  lower(trim(query))                as query,
  count(*)                          as searches,
  sum(case when results = 0 then 1 else 0 end) as zero_result_hits,
  max(created_at)                   as last_searched
from public.search_log
where created_at > now() - interval '30 days'
  and length(trim(query)) between 2 and 60
group by lower(trim(query))
having count(*) > 1
order by searches desc;

-- ── price_history ──────────────────────────────────────────────────────
-- Audit fix 2.3 + idea 7.2. AI tool prices move constantly and nobody
-- tracks them. This turns a maintenance chore into a content engine:
-- /price-changes becomes a page that updates itself.
create table if not exists public.price_history (
  id             bigserial primary key,
  tool_slug      text        not null,
  starting_price text,
  source_url     text,
  noticed_at     timestamptz not null default now()
);
create index if not exists price_history_slug_idx on public.price_history (tool_slug, noticed_at desc);

alter table public.price_history enable row level security;

create policy "price history is publicly readable"
  on public.price_history for select
  to anon, authenticated
  using (true);

-- ── newsletter double opt-in ───────────────────────────────────────────
-- Audit fix 6.5. Addresses were stored with no confirmation step, no
-- unsubscribe link and no welcome mail — a GDPR/CAN-SPAM problem, and the
-- "Founding 500" badge was promised with no system behind it.
alter table if exists public.newsletter_subscribers
  add column if not exists confirmed        boolean     not null default false,
  add column if not exists confirm_token    text,
  add column if not exists confirmed_at     timestamptz,
  add column if not exists unsubscribed_at  timestamptz,
  add column if not exists unsub_token      text;

create index if not exists newsletter_confirm_token_idx
  on public.newsletter_subscribers (confirm_token) where confirm_token is not null;
create index if not exists newsletter_unsub_token_idx
  on public.newsletter_subscribers (unsub_token) where unsub_token is not null;

-- ── admin audit log ────────────────────────────────────────────────────
-- Audit fix 6.2. The admin panel had no record of who changed what.
create table if not exists public.admin_audit_log (
  id          bigserial primary key,
  action      text        not null,
  entity      text,
  entity_id   text,
  detail      jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists admin_audit_created_idx on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;

commit;
