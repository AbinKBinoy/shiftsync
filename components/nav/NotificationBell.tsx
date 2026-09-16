'use client';

import { useEffect, useRef, useState } from 'react';
import type { SVGProps } from 'react';
import { useRouter } from 'next/navigation';
import type { Notification, NotificationType } from '@/types';

const POLL_INTERVAL_MS = 45_000;

function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
      <path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

// Routed by notification type, not target_type — a shift_claim notification
// means one thing for the team lead who needs to approve it (send them to
// the approval queue) and something else entirely for the member who
// submitted it (send them to their calendar, since /link-names redirects
// non-team-leads away immediately).
function hrefFor(type: NotificationType): string {
  switch (type) {
    case 'swap_request':
    case 'swap_claimed':
    case 'swap_approved':
    case 'swap_rejected':
      return '/open-shifts';
    case 'shift_claim_pending':
      return '/link-names';
    case 'shift_claim_approved':
    case 'schedule_published':
    case 'comment':
    default:
      return '/calendar';
  }
}

// notifications.created_at is a full timestamp, unlike shifts.date — same
// reason ShiftClaimApprovals.tsx keeps its own local time formatter instead
// of using lib/dates.ts's plain-date formatters.
function formatRelativeTime(iso: string): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationBell({
  className = '',
  align = 'right',
}: {
  className?: string;
  // Which side of the trigger button the dropdown hangs from. The sidebar
  // bell sits near the left edge of the screen, so a right-anchored dropdown
  // (extending leftward) would run off-screen — it needs 'left' instead
  // (extending rightward, into the main content area). The mobile floating
  // bell sits in the top-right corner, where 'right' (the default, extending
  // leftward) is what stays on-screen.
  align?: 'left' | 'right';
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unread_count ?? 0);
      } catch {
        // Best-effort — the next poll will retry.
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  async function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
    } catch {
      // Best-effort — the next poll reconciles state either way.
    }
  }

  async function handleSelect(notification: Notification) {
    setOpen(false);

    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      fetch(`/api/notifications/${notification.id}/read`, { method: 'PATCH' }).catch(() => {});
    }

    router.push(hrefFor(notification.type));
  }

  return (
    <div className={className}>
      {/* Positioning (fixed/static/etc.) is left to `className` on the outer
          div above; this inner one only ever needs `relative` so the
          dropdown can anchor to it, regardless of how the outer is placed. */}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-navy-600 text-ink-300 transition-colors hover:border-navy-500 hover:text-ink-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900"
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-semibold leading-none text-navy-950">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div
            role="menu"
            className={`absolute top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-navy-700 bg-navy-900 shadow-2xl shadow-black/40 ${
              align === 'left' ? 'left-0' : 'right-0'
            }`}
          >
            <div className="flex items-center justify-between border-b border-navy-800 px-4 py-3">
              <span className="text-sm font-semibold text-ink-100">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="rounded text-xs font-medium text-yellow-400 hover:text-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-6 text-center text-sm text-ink-500">Loading…</p>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-ink-500">
                  You&rsquo;re all caught up.
                </p>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    role="menuitem"
                    onClick={() => handleSelect(notification)}
                    className={`flex w-full flex-col gap-1 border-b border-navy-800 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-navy-800/60 focus:outline-none focus-visible:bg-navy-800/60 ${
                      notification.read ? '' : 'bg-navy-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />
                      )}
                      <span
                        className={`truncate text-sm font-medium ${
                          notification.read ? 'text-ink-300' : 'text-ink-100'
                        }`}
                      >
                        {notification.title}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-ink-500">{notification.message}</p>
                    <span className="text-[11px] text-ink-500">
                      {formatRelativeTime(notification.created_at)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
