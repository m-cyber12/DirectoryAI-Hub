-- ============================================================================
-- 0007_stark_poll.sql — the "which Tony Stark is better?" easter-egg poll
--
-- Real counting (owner request: «جواب‌ها شمارش بشه»). One row per option;
-- votes increment via the service role only (POST /api/poll is rate-limited).
-- Anon can read totals. When Supabase is not configured the UI falls back to
-- per-browser localStorage counts and says so.
-- ============================================================================

create table if not exists public.stark_poll (
  option_key  text primary key,
  label       text not null,
  votes       bigint not null default 0,
  updated_at  timestamptz not null default now()
);

insert into public.stark_poll (option_key, label)
values
  ('ironman', 'Iron Man'),
  ('doom', 'Doctor Doom')
on conflict (option_key) do nothing;

alter table public.stark_poll enable row level security;

drop policy if exists "Read poll totals" on public.stark_poll;
create policy "Read poll totals"
  on public.stark_poll for select
  to anon, authenticated
  using (true);

-- No anon writes: voting goes through the rate-limited API (service role).
