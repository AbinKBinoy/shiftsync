'use client';

import { useDashboard } from './DashboardData';
import { formatTime, parseISODate } from '@/lib/dates';
import type { Shift, SwapRequest } from '@/types';

const ACTIVE = ['open', 'claimed', 'pending_approval'];

const STATUS_TONE: Record<string, string> = {
  open: 'border-amber-700 bg-amber-950 text-amber-200',
  claimed: 'border-blue-800 bg-blue-950 text-blue-200',
  pending_approval: 'border-orange-700 bg-orange-950 text-orange-200',
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
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
      <h2 className="text-sm font-medium text-zinc-300">
        Swap requests{active.length > 0 ? ` (${active.length})` : ''}
      </h2>

      {swapsLoading ? (
        <p className="mt-3 text-sm text-zinc-500">Loading swap requests…</p>
      ) : active.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">
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
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-left transition-colors hover:border-zinc-600"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-zinc-100">
                      {swap.requester?.full_name?.trim() ||
                        swap.requester?.email ||
                        'Unknown'}
                      {mine && (
                        <span className="ml-2 text-xs text-zinc-500">you</span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium ${
                        STATUS_TONE[swap.status] ??
                        'border-zinc-700 bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {swap.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                    <span className="rounded border border-zinc-700 px-1.5 py-0.5 capitalize text-zinc-300">
                      {swap.type}
                    </span>
                    {shift ? (
                      <span className="tabular-nums">
                        {shortDate(shift.date)} · {formatTime(shift.start_time)}–
                        {formatTime(shift.end_time)}
                      </span>
                    ) : (
                      <span className="text-zinc-600">Shift unavailable</span>
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
