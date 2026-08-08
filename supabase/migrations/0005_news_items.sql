-- ============================================================================
-- 0005_news_items.sql — AI News Aggregator storage (idea #13)
--
-- The /news feed is served from a snapshot written by the scheduled
-- /api/news/refresh cron. This table stores that snapshot. Reads are allowed
-- for anon + authenticated (so the public page can serve it); writes are
-- restricted to the service role, exactly like every other table post-migration
-- 0003. Only the server-side cron (which uses SUPABASE_SERVICE_ROLE_KEY) may
-- write here.
-- ============================================================================

create table if not exists public.news_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  source text not null default '',
  source_url text not null default '',
  published_at timestamptz not null default now(),
  iso_date text not null default '',
  category text not null default 'Industry',
  image text,
  ai_summarized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_items_published_at_idx on public.news_items (published_at desc);

-- Optional: prune old rows to keep the table small. Cron can call this.
create or replace function public.prune_news_items(max_age_days int default 30)
returns int
language sql
security invoker
as $$
  with deleted as (
    delete from public.news_items
    where published_at < now() - make_interval(days => max_age_days)
    returning 1
  )
  select count(*) from deleted;
$$;

-- Read-only access for anon/authenticated (matches the locked-down RLS model).
alter table public.news_items enable row level security;

drop policy if exists "Read news items" on public.news_items;
create policy "Read news items"
  on public.news_items for select
  using (true);
