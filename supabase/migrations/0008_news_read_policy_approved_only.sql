-- ============================================================================
-- 0008_news_read_policy_approved_only.sql — SECURITY FIX
--
-- Background (from the review): migration 0005 opened a public read policy on
-- `news_items` with `using (true)`. Migration 0006 added the `approved`
-- column and the public page only *serves* approved rows, but the RLS policy
-- was never tightened — so a `pending` (unapproved) story inserted by the
-- refresh cron could still be read directly through the Supabase REST API by
-- any visitor, even though the UI hides it.
--
-- This migration closes that gap: the public read policy now only returns
-- rows where `approved = true`. The service-role admin path is unaffected
-- (the service role bypasses RLS), so the admin review queue still sees the
-- full set of pending items.
-- ============================================================================

begin;

-- Drop the wide-open read policy from 0005 if it still exists.
drop policy if exists "Read news items" on public.news_items;

-- Re-create it so only editor-approved items are publicly readable.
create policy "Approved news items are publicly readable"
  on public.news_items for select
  to anon, authenticated
  using (approved = true);

commit;
