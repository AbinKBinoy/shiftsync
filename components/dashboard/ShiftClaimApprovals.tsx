'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useDashboard } from './DashboardData';
import { PRESS } from '@/lib/motion';

const positiveButton = `rounded-lg bg-yellow-400 px-3 py-1.5 text-sm font-semibold text-navy-950 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50 ${PRESS}`;
const destructiveButton = `rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-1.5 text-sm font-medium text-rose-300 hover:border-rose-700 hover:bg-rose-950/70 disabled:cursor-not-allowed disabled:opacity-50 ${PRESS}`;

// claim.created_at is a full timestamp, unlike shifts.date — lib/dates.ts's
// formatters assume plain 'YYYY-MM-DD' dates, so this one stays local here.
function formatClaimTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ShiftClaimApprovals() {
  const { claims, claimsLoading, refresh } = useDashboard();
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = claims.filter((c) => c.status === 'pending');

  async function resolve(claimId: string, action: 'approve' | 'reject') {
    setBusyId(claimId);
    try {
      const res = await fetch(`/api/shift-claims/${claimId}/${action}`, {
        method: 'PATCH',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? 'That action failed');
        return;
      }
      toast.success(action === 'approve' ? 'Claim approved' : 'Claim rejected');
      refresh();
    } catch {
      toast.error('Could not reach the server. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  // Nothing pending — the manual NameLinker tool below still works as a
  // fallback, so there's nothing useful to show here.
  if (claimsLoading || pending.length === 0) return null;

  return (
    <section className="rounded-2xl border border-navy-700 bg-navy-900 p-6 shadow-xl shadow-black/20">
      <h2 className="text-sm font-medium text-ink-300">
        Shift claims ({pending.length})
      </h2>
      <p className="mt-1 text-sm text-ink-500">
        Members asking to be linked to a name from the schedule photo.
      </p>

      <ul className="mt-4 space-y-2">
        {pending.map((claim) => (
          <li
            key={claim.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-navy-700 bg-navy-950 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-ink-100">
                <span className="font-medium">
                  {claim.requester?.full_name?.trim() || 'Unnamed member'}
                </span>{' '}
                wants to be linked to{' '}
                <span className="font-medium">{claim.employee_name}</span>
              </p>
              <p className="text-xs text-ink-500">
                {formatClaimTime(claim.created_at)}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={busyId === claim.id}
                onClick={() => resolve(claim.id, 'approve')}
                className={positiveButton}
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busyId === claim.id}
                onClick={() => resolve(claim.id, 'reject')}
                className={destructiveButton}
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
