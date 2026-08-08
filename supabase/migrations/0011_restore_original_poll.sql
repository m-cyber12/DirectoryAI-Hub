-- ============================================================================
-- 0011_restore_original_poll.sql — restore the original gauntlet poll rows
--
-- Background: an earlier migration (0010, later reverted) had swapped the
-- "which Tony Stark is better? Iron Man vs Doctor Doom" poll options for
-- creator-workflow options. The site owner asked to restore the original
-- Infinity Gauntlet experience, so we put the original rows back. This is
-- idempotent and safe whether or not 0010 was ever applied:
--   * fresh DBs: 0007 created ironman/doom rows, and this re-asserts them;
--   * DBs that applied 0010: this deletes the workflow options and restores.
-- ============================================================================

begin;

delete from public.stark_poll where option_key not in ('ironman', 'doom');

insert into public.stark_poll (option_key, label, votes)
values
  ('ironman', 'Iron Man', 0),
  ('doom', 'Doctor Doom', 0)
on conflict (option_key) do nothing;

commit;
