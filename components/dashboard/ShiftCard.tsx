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
  if (shift.status === 'open') {
    return 'border-navy-700 border-l-amber-400 bg-navy-800/70 hover:border-l-amber-300';
  }
  if (shift.status === 'swap_pending') {
    return 'border-navy-700 border-l-orange-400 bg-navy-800/70 hover:border-l-orange-300';
  }
  if (shift.user_id && shift.user_id === currentUserId) {
    return 'border-navy-700 border-l-yellow-400 bg-navy-800/70 hover:border-l-yellow-300';
  }
  return 'border-navy-700 border-l-navy-600 bg-navy-800/40 hover:border-l-navy-500';
}

function statusSuffixFor(shift: Shift): string {
  if (shift.status === 'open') return ', open for claim';
  if (shift.status === 'swap_pending') return ', swap pending';
  return '';
}

export default function ShiftCard({
  shift,
  currentUserId,
  onClick,
}: ShiftCardProps) {
  const isMine = Boolean(shift.user_id) && shift.user_id === currentUserId;
  const timeRange = `${formatTime(shift.start_time)}–${formatTime(shift.end_time)}`;
  const ariaLabel = `${shift.employee_name}, ${timeRange}${
    isMine ? ', your shift' : ''
  }${statusSuffixFor(shift)}`;

  return (
    <button
      type="button"
      onClick={() => onClick(shift)}
      aria-label={ariaLabel}
      className={`focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow-400 w-full rounded-md border border-l-4 px-3 py-2 text-left transition-colors ${toneFor(
        shift,
        currentUserId
      )}`}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="truncate text-sm font-medium text-ink-100">
          {shift.employee_name}
        </span>
        {!shift.user_id && (
          <span
            title="No linked account"
            aria-hidden="true"
            className="shrink-0 text-xs leading-none text-ink-500"
          >
            ?
          </span>
        )}
      </div>
      <div className="mt-1 text-xs tabular-nums text-ink-300">
        {timeRange}
        {isMine && <span className="ml-1 text-yellow-400">you</span>}
      </div>
    </button>
  );
}
