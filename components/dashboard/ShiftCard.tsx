'use client';

import { formatTime } from '@/lib/dates';
import type { Shift } from '@/types';

type ShiftCardProps = {
  shift: Shift;
  currentUserId: string;
  onClick: (shift: Shift) => void;
};

// Status carries the more urgent signal, so an open or pending shift keeps its
// colour even when it belongs to the current user.
function toneFor(shift: Shift, currentUserId: string): string {
  if (shift.status === 'open') return 'border-amber-600 bg-amber-950';
  if (shift.status === 'swap_pending') return 'border-orange-600 bg-orange-950';
  if (shift.user_id && shift.user_id === currentUserId) {
    return 'border-blue-600 bg-blue-950';
  }
  return 'border-zinc-700 bg-zinc-800';
}

export default function ShiftCard({
  shift,
  currentUserId,
  onClick,
}: ShiftCardProps) {
  const isMine = Boolean(shift.user_id) && shift.user_id === currentUserId;

  return (
    <button
      type="button"
      onClick={() => onClick(shift)}
      className={`w-full rounded-md border px-2 py-1.5 text-left transition-colors hover:border-zinc-500 ${toneFor(
        shift,
        currentUserId
      )}`}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="truncate text-xs font-medium text-zinc-100">
          {shift.employee_name}
        </span>
        {!shift.user_id && (
          <span
            title="No linked account"
            aria-label="No linked account"
            className="shrink-0 text-xs leading-none text-zinc-500"
          >
            ?
          </span>
        )}
      </div>
      <div className="mt-0.5 text-xs tabular-nums text-zinc-400">
        {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
        {isMine && <span className="ml-1 text-blue-400">you</span>}
      </div>
    </button>
  );
}
