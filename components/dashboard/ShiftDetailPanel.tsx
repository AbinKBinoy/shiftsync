'use client';

import { useEffect } from 'react';
import { formatFullDate, formatTime } from '@/lib/dates';
import type { Shift, ShiftStatus } from '@/types';

type ShiftDetailPanelProps = {
  shift: Shift | null;
  currentUserId: string;
  onClose: () => void;
};

const STATUS_LABELS: Record<ShiftStatus, string> = {
  assigned: 'Assigned',
  open: 'Open',
  swap_pending: 'Swap pending',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm text-zinc-100">{children}</dd>
    </div>
  );
}

export default function ShiftDetailPanel({
  shift,
  currentUserId,
  onClose,
}: ShiftDetailPanelProps) {
  // Close on Escape while the panel is open.
  useEffect(() => {
    if (!shift) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shift, onClose]);

  if (!shift) return null;

  const isMine = Boolean(shift.user_id) && shift.user_id === currentUserId;

  return (
    <div className="fixed inset-0 z-50">
      <div
        onClick={onClose}
        aria-hidden
        className="absolute inset-0 bg-black/60"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shift details"
        className="absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto border-l border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-medium text-zinc-50">Shift details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md border border-zinc-700 px-2 py-1 text-sm leading-none text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-100"
          >
            ✕
          </button>
        </div>

        <dl className="mt-6 space-y-5">
          <Field label="Employee">
            {shift.employee_name}
            {isMine && <span className="ml-2 text-xs text-blue-400">you</span>}
          </Field>

          <Field label="Date">{formatFullDate(shift.date)}</Field>

          <Field label="Time">
            <span className="tabular-nums">
              {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
            </span>
          </Field>

          <Field label="Status">
            {STATUS_LABELS[shift.status] ?? shift.status}
          </Field>

          <Field label="Linked account">
            {shift.profile ? (
              <span>
                {shift.profile.full_name?.trim() || shift.profile.email}
                <span className="block text-xs text-zinc-500">
                  {shift.profile.email}
                </span>
              </span>
            ) : (
              <span className="text-zinc-500">
                Not linked to a member yet — this shift only has a name from the
                schedule photo.
              </span>
            )}
          </Field>
        </dl>
      </aside>
    </div>
  );
}
