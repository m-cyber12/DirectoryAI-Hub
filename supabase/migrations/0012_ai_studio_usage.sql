-- AI Studio access: authenticated users receive three free utility runs per UTC day.
-- The service-role API is the only caller of the RPC; RLS prevents direct writes.
begin;

create table if not exists public.studio_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'studio_unlimited')),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'expired')),
  current_period_end timestamptz,
  provider text,
  provider_customer_id text,
  provider_subscription_id text unique,
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_slug text not null check (tool_slug in ('prompt-builder', 'thumbnail-brief', 'thumbnail-text', 'content-calendar', 'image-tools', 'subtitle-tools', 'audio-trimmer', 'video-inspector')),
  created_at timestamptz not null default now(),
  input_summary jsonb not null default '{}'::jsonb,
  output_summary jsonb not null default '{}'::jsonb
);
create index if not exists studio_usage_user_created_idx on public.studio_usage_events (user_id, created_at desc);

alter table public.studio_entitlements enable row level security;
alter table public.studio_usage_events enable row level security;

create policy "Users can read their own Studio entitlement"
  on public.studio_entitlements for select to authenticated using (auth.uid() = user_id);
create policy "Users can read their own Studio history"
  on public.studio_usage_events for select to authenticated using (auth.uid() = user_id);

-- Serialize free-tier consumption per user/day so simultaneous browser tabs cannot bypass the quota.
create or replace function public.consume_studio_run(p_user_id uuid, p_tool_slug text)
returns table (allowed boolean, remaining integer, unlimited boolean, event_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  is_unlimited boolean := false;
  used_today integer := 0;
  new_event uuid;
begin
  perform pg_advisory_xact_lock(hashtext(p_user_id::text || ':' || (now() at time zone 'utc')::date::text));

  select exists(
    select 1 from public.studio_entitlements
    where user_id = p_user_id
      and plan = 'studio_unlimited'
      and status = 'active'
      and (current_period_end is null or current_period_end > now())
  ) into is_unlimited;

  if not is_unlimited then
    select count(*) into used_today from public.studio_usage_events
    where user_id = p_user_id
      and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
    if used_today >= 3 then
      return query select false, 0, false, null::uuid;
      return;
    end if;
  end if;

  insert into public.studio_usage_events(user_id, tool_slug)
  values (p_user_id, p_tool_slug) returning id into new_event;

  return query select true,
    case when is_unlimited then -1 else 2 - used_today end,
    is_unlimited, new_event;
end;
$$;

revoke all on function public.consume_studio_run(uuid, text) from public, anon, authenticated;
grant execute on function public.consume_studio_run(uuid, text) to service_role;
commit;
