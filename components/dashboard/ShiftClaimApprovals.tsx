'use client';

import { useState } from 'react';
import { useDashboard } from './DashboardData';

const positiveButton =
  'rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50';
const destructiveButton =
  'rounded-lg border border-rose-800 bg-rose-950 px-3 py-1.5 text-sm font-medium text-rose-200 transition-colors hover:border-rose-700 disabled:cursor-not-allowed disabled:opacity-50';

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
  const [error, setError] = useState<string | null>(null);

  const pending = claims.filter((c) => c.status === 'pending');

  async function resolve(claimId: string, action: 'approve' | 'reject') {
    setBusyId(claimId);
    setError(null);
    try {
      const res = await fetch(`/api/shift-claims/${claimId}/${action}`, {
        method: 'PATCH',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'That action failed');
        return;
      }
      refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  // Nothing pending — the manual NameLinker tool below still works as a
  // fallback, so there's nothing useful to show here.
  if (claimsLoading || pending.length === 0) return null;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
      <h2 className="text-sm font-medium text-zinc-300">
        Shift claims ({pending.length})
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Members asking to be linked to a name from the schedule photo.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {pending.map((claim) => (
          <li
            key={claim.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-zinc-100">
                <span className="font-medium">
                  {claim.requester?.full_name?.trim() || 'Unnamed member'}
                </span>{' '}
                wants to be linked to{' '}
                <span className="font-medium">{claim.employee_name}</span>
              </p>
              <p className="text-xs text-zinc-500">
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
