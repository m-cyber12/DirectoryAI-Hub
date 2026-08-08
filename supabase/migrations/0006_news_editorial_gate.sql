-- ============================================================================
-- 0006_news_editorial_gate.sql — editorial review queue for auto-news
--
-- AUDIT_IMPLEMENTATION_FA requirement: "before enabling the cron, turn the
-- refresh pipeline into a review queue". Critique §7: auto-aggregated news
-- damaged topical authority. Together with the scored relevance gate in
-- src/lib/newsRelevance.ts, nothing now reaches /news without passing:
--
--   1. the automated relevance gate (at ingest AND at read time), and
--   2. a human approval click in the admin panel (this column).
--
-- Rows inserted by /api/news/refresh start approved = false. The public page
-- only serves approved rows. Approve/reject from /admin → News tab
-- (or PATCH /api/admin/news).
-- ============================================================================

alter table if exists public.news_items
  add column if not exists approved boolean not null default false;

create index if not exists news_items_approved_idx
  on public.news_items (approved, published_at desc);

-- Helper for the admin UI: how many items are waiting for review.
create or replace function public.pending_news_count()
returns bigint
language sql
security invoker
stable
as $$
  select count(*) from public.news_items where approved = false;
$$;
