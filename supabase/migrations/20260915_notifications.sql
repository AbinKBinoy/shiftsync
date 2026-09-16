-- In-app notifications.
--
-- Shape matches the existing Notification/NotificationType/NotificationTargetType
-- types documented in types/index.ts and CLAUDE.md, extended with two new
-- NotificationType values ('shift_claim_pending', 'shift_claim_approved') and
-- one new NotificationTargetType value ('shift_claim') that the original
-- shape didn't yet cover.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'swap_request',
    'swap_claimed',
    'swap_approved',
    'swap_rejected',
    'schedule_published',
    'comment',
    'shift_claim_pending',
    'shift_claim_approved'
  )),
  title text not null,
  message text not null,
  target_type text not null check (target_type in (
    'shift',
    'swap_request',
    'schedule',
    'shift_claim'
  )),
  target_id uuid not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Every read is "my notifications, newest first" or "my unread notifications" —
-- both served by this one index.
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read = false;

alter table public.notifications enable row level security;

-- Users can see only their own notifications.
create policy "Users can view their own notifications"
  on public.notifications
  for select
  using (user_id = auth.uid());

-- Users can update only their own notifications (the app only ever sets
-- `read = true` via /api/notifications/[id]/read and /read-all).
create policy "Users can update their own notifications"
  on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- No insert/delete policy for authenticated or anon roles is defined on
-- purpose: notifications are only ever created by API routes using the
-- service-role client (lib/supabase/admin.ts), which bypasses RLS entirely.
-- Without an insert policy, a regular authenticated user cannot create
-- notification rows for themselves or anyone else.
