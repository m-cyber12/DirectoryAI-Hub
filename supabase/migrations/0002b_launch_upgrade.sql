-- ================================================================
-- CreatorAI Hub — Pre-Launch Upgrade Migration
-- Run this in Supabase SQL Editor AFTER supabase-schema.sql
-- Adds: reviews, user bookmarks, newsletter subscribers, click log
-- ================================================================

-- 1) Community reviews -------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  tool_slug text not null,
  rating int not null check (rating between 1 and 5),
  title text not null check (char_length(title) between 3 and 80),
  body text not null check (char_length(body) between 20 and 1200),
  author_name text not null default 'Anonymous Creator',
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'approved' check (status in ('approved','pending','rejected')),
  helpful_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists reviews_tool_slug_idx on public.reviews (tool_slug, status, created_at desc);

alter table public.reviews enable row level security;
drop policy if exists "reviews are readable by everyone" on public.reviews;
create policy "reviews are readable by everyone"
  on public.reviews for select using (status = 'approved');
drop policy if exists "anyone can insert reviews" on public.reviews;
create policy "anyone can insert reviews"
  on public.reviews for insert with check (true);

-- helpful counter RPC (called from the API)
create or replace function public.increment_helpful(review_id uuid)
returns void language sql security definer as $$
  update public.reviews set helpful_count = helpful_count + 1 where id = review_id;
$$;

-- 2) User bookmarks (cloud sync for signed-in users) -------------------
create table if not exists public.user_bookmarks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  slugs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_bookmarks enable row level security;
drop policy if exists "users manage own bookmarks" on public.user_bookmarks;
create policy "users manage own bookmarks"
  on public.user_bookmarks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) Newsletter subscribers --------------------------------------------
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text default 'homepage',
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
drop policy if exists "anyone can subscribe" on public.newsletter_subscribers;
create policy "anyone can subscribe"
  on public.newsletter_subscribers for insert with check (true);
-- (no select policy: emails are not publicly readable)

-- 4) Affiliate click log (analytics) ------------------------------------
create table if not exists public.click_log (
  id bigint generated always as identity primary key,
  tool_slug text not null,
  referer text,
  created_at timestamptz not null default now()
);
create index if not exists click_log_slug_idx on public.click_log (tool_slug, created_at desc);
alter table public.click_log enable row level security;
drop policy if exists "anyone can log clicks" on public.click_log;
create policy "anyone can log clicks"
  on public.click_log for insert with check (true);

-- 5) Performance indexes on tools (from audit §5.1) ----------------------
create index if not exists tools_category_idx on public.tools (category);
create index if not exists tools_pricing_idx on public.tools (pricing);
create index if not exists tools_featured_idx on public.tools (is_featured);

-- ================================================================
-- AUTH SETUP (do this in the Supabase Dashboard, not SQL):
-- 1. Authentication → Providers → Email: enable "Magic Link"
-- 2. Authentication → Providers → Google: add OAuth credentials
-- 3. Authentication → URL Configuration:
--      Site URL:  https://directory-ai-hub.vercel.app
--      Redirect:  https://directory-ai-hub.vercel.app/**
-- ================================================================
