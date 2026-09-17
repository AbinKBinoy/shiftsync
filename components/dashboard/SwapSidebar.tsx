'use client';

import { useDashboard } from './DashboardData';
import { formatTime, parseISODate } from '@/lib/dates';
import type { Shift, SwapRequest } from '@/types';

const ACTIVE = ['open', 'claimed', 'pending_approval'];

const STATUS_TONE: Record<string, string> = {
  open: 'border-amber-700/60 bg-amber-500/10 text-amber-300',
  claimed: 'border-orange-700/60 bg-orange-500/10 text-orange-300',
  pending_approval: 'border-orange-600/60 bg-orange-500/15 text-orange-200',
};

function shortDate(value: string): string {
  return parseISODate(value).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function SwapSidebar() {
  const { swaps, swapsLoading, openShift, currentUserId } = useDashboard();

  const active = swaps.filter((s) => ACTIVE.includes(s.status));

  function handleOpen(swap: SwapRequest) {
    const shift = (swap.original_shift ?? swap.offered_shift) as Shift | undefined;
    if (shift) openShift(shift);
  }

  return (
    <section className="rounded-2xl border border-navy-700 bg-navy-900 p-6 shadow-xl shadow-black/20">
      <h2 className="text-sm font-medium text-ink-300">
        Swap requests{active.length > 0 ? ` (${active.length})` : ''}
      </h2>

      {swapsLoading ? (
        <p className="mt-3 text-sm text-ink-500">Loading swap requests…</p>
      ) : active.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">
          No open swap requests. Drop or trade a shift to start one.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {active.map((swap) => {
            const shift = swap.original_shift;
            const mine = swap.requester_id === currentUserId;

            return (
              <li key={swap.id}>
                <button
                  type="button"
                  onClick={() => handleOpen(swap)}
                  className="w-full rounded-lg border border-navy-700 bg-navy-950 px-3 py-2.5 text-left transition-all duration-150 hover:border-navy-500 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-ink-100">
                      {swap.requester?.full_name?.trim() ||
                        swap.requester?.email ||
                        'Unknown'}
                      {mine && (
                        <span className="ml-2 text-xs text-ink-500">you</span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium ${
                        STATUS_TONE[swap.status] ??
                        'border-navy-600 bg-navy-800 text-ink-300'
                      }`}
                    >
                      {swap.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-ink-300">
                    <span className="rounded border border-navy-600 px-1.5 py-0.5 capitalize text-ink-300">
                      {swap.type}
                    </span>
                    {shift ? (
                      <span className="tabular-nums">
                        {shortDate(shift.date)} · {formatTime(shift.start_time)}–
                        {formatTime(shift.end_time)}
                      </span>
                    ) : (
                      <span className="text-ink-500">Shift unavailable</span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
