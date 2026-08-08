-- ============================================================================
-- 0009_founder_claims.sql — real backend for the Founder Claim form
--
-- Background (audit fix 2.2): FounderClaimForm previously "submitted" with a
-- setTimeout + fake success and stored nothing. This table is the real queue:
-- a founder submits, their claim is stored as `pending`, and an admin reviews
-- it in /admin. Writes only flow through the server-side API using the service
-- role (migration 0003 already revokes anon writes). No public read: the list
-- must never leak.
-- ============================================================================

create table if not exists public.founder_claims (
  id uuid primary key default gen_random_uuid(),
  tool_slug text not null,
  company_email text not null,
  role text not null default 'Founder / CEO',
  notes text not null default '',
  will_embed_badge boolean not null default true,
  status text not null default 'pending',        -- pending | verified | rejected
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists founder_claims_status_idx
  on public.founder_claims (status, created_at desc);

alter table public.founder_claims enable row level security;
-- No SELECT/INSERT/UPDATE/DELETE policies: only the service role (server code)
-- may touch this table.
