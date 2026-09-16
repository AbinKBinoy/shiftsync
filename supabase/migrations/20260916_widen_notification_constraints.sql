-- The `notifications` table currently deployed in Supabase has the
-- original, narrower CHECK constraints (matching the pre-existing shape from
-- CLAUDE.md/types before shift-claim notifications were added):
--   type CHECK: 'swap_request' | 'swap_claimed' | 'swap_approved' |
--               'swap_rejected' | 'schedule_published' | 'comment'
--   target_type CHECK: 'shift' | 'swap_request' | 'schedule'
--
-- The app now also inserts type = 'shift_claim_pending' / 'shift_claim_approved'
-- and target_type = 'shift_claim' for shift-claim notifications. Every one of
-- those inserts has been silently failing with a 23514 check-constraint
-- violation, caught and logged (not surfaced) by createNotification /
-- notifyTeamLeads in lib/notifications.ts — which is why no shift-claim
-- notifications were ever appearing in the bell, while the separate email
-- code path (unaffected by this table) kept working.
--
-- This widens both constraints to match what the application actually
-- inserts today. Swap notifications were never affected — 'swap_request'
-- and 'shift' were always allowed.

alter table public.notifications
  drop constraint notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'swap_request',
    'swap_claimed',
    'swap_approved',
    'swap_rejected',
    'schedule_published',
    'comment',
    'shift_claim_pending',
    'shift_claim_approved'
  ));

alter table public.notifications
  drop constraint notifications_target_type_check;

alter table public.notifications
  add constraint notifications_target_type_check
  check (target_type in (
    'shift',
    'swap_request',
    'schedule',
    'shift_claim'
  ));
