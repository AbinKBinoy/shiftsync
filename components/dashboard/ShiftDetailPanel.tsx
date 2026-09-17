'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDashboard } from './DashboardData';
import { formatFullDate, formatTime } from '@/lib/dates';
import { exitAnimationDelay, MOTION_MS } from '@/lib/motion';
import type { Shift, ShiftStatus } from '@/types';

type ShiftDetailPanelProps = {
  shift: Shift | null;
  onClose: () => void;
};

const STATUS_LABELS: Record<ShiftStatus, string> = {
  assigned: 'Assigned',
  open: 'Open',
  swap_pending: 'Swap pending',
};

const positiveButton =
  'rounded-lg bg-yellow-400 px-3 py-2 text-sm font-semibold text-navy-950 transition-all duration-150 hover:bg-yellow-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50';
const neutralButton =
  'rounded-lg border border-navy-600 px-3 py-2 text-sm font-medium text-ink-300 transition-all duration-150 hover:border-navy-500 hover:text-ink-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50';
const destructiveButton =
  'rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm font-medium text-rose-300 transition-all duration-150 hover:border-rose-700 hover:bg-rose-950/70 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-1 text-sm text-ink-100">{children}</dd>
    </div>
  );
}

export default function ShiftDetailPanel({
  shift: shiftProp,
  onClose,
}: ShiftDetailPanelProps) {
  const { departmentId, currentUserId, isTeamLead, shifts, claims, swapForShift, refresh } =
    useDashboard();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [offeredShiftId, setOfferedShiftId] = useState('');

  // The panel slides/fades out rather than vanishing, so it needs to stay
  // mounted (showing the last real shift) for one exit-animation beat after
  // `shift` goes null, then actually unmount. `entered` drives the
  // transform/opacity; `renderedShift` is what's rendered, always the most
  // recent non-null shift so content doesn't blank out mid-exit.
  const [renderedShift, setRenderedShift] = useState<Shift | null>(null);
  const [entered, setEntered] = useState(false);
  const [prevShiftProp, setPrevShiftProp] = useState(shiftProp);

  // Reacting to the prop change happens here, during render, rather than in
  // an effect — this is React's documented pattern for adjusting state when
  // a prop changes ("you might not need an effect"), and it lets the exit
  // transition start on the very same render as the close instead of
  // waiting a tick for an effect to fire. The two effects below are left
  // with only genuine async subscriptions (a rAF, a timer), each setting
  // state from its own callback rather than synchronously in the effect body.
  if (shiftProp !== prevShiftProp) {
    setPrevShiftProp(shiftProp);
    if (shiftProp) {
      setRenderedShift(shiftProp);
    } else {
      setEntered(false);
    }
  }

  useEffect(() => {
    if (!shiftProp) return;
    // Scheduling "entered" a frame after mount (rather than in the same
    // tick) is what makes the transition actually play — toggling both in
    // one render would skip straight to the end state with no visible motion.
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [shiftProp]);

  useEffect(() => {
    if (shiftProp || !renderedShift) return;
    const timeout = setTimeout(
      () => setRenderedShift(null),
      exitAnimationDelay(MOTION_MS.slow)
    );
    return () => clearTimeout(timeout);
  }, [shiftProp, renderedShift]);

  useEffect(() => {
    if (!shiftProp) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shiftProp, onClose]);

  const swap = renderedShift ? swapForShift(renderedShift.id) : null;

  // Most recent self-claim this user has made for this shift's name, if any.
  // A rejected claim doesn't block trying again, so only pending/approved
  // are treated as "already handled" — claims are already newest-first.
  const myClaim = useMemo(() => {
    if (!renderedShift || renderedShift.user_id) return null;
    return (
      claims.find(
        (c) =>
          c.employee_name === renderedShift.employee_name &&
          c.requested_by === currentUserId &&
          (c.status === 'pending' || c.status === 'approved')
      ) ?? null
    );
  }, [claims, renderedShift, currentUserId]);

  // A trade is proposed for one specific shift, so only its owner can accept.
  const tradeableShifts = useMemo(
    () =>
      shifts.filter(
        (s) =>
          s.id !== renderedShift?.id &&
          s.status === 'assigned' &&
          s.user_id &&
          s.user_id !== currentUserId
      ),
    [shifts, renderedShift?.id, currentUserId]
  );

  if (!renderedShift) return null;

  const shift = renderedShift;
  const isMine = Boolean(shift.user_id) && shift.user_id === currentUserId;
  const isRequester = swap?.requester_id === currentUserId;
  const offeredToMe =
    swap?.type === 'trade' &&
    swap.status === 'open' &&
    swap.offered_shift_id != null &&
    shifts.some(
      (s) => s.id === swap.offered_shift_id && s.user_id === currentUserId
    );

  async function act(path: string, init?: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, init);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'That action failed');
        return;
      }
      setTradeOpen(false);
      setOfferedShiftId('');
      refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const createSwap = (type: 'drop' | 'trade', offered?: string) =>
    act('/api/swaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        original_shift_id: shift.id,
        type,
        ...(offered ? { offered_shift_id: offered } : {}),
      }),
    });

  const swapAction = (action: string) =>
    swap ? act(`/api/swaps/${swap.id}/${action}`, { method: 'PATCH' }) : undefined;

  const claimShift = () =>
    act('/api/shift-claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        department_id: departmentId,
        employee_name: shift.employee_name,
      }),
    });

  return (
    <div className="fixed inset-0 z-50">
      <div
        onClick={onClose}
        aria-hidden
        className={`absolute inset-0 bg-black/60 transition-opacity duration-400 ${
          entered ? 'opacity-100 ease-enter' : 'opacity-0 ease-exit'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shift details"
        className={`absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto border-l border-navy-700 bg-navy-900 p-6 shadow-2xl transition-transform duration-400 ${
          entered ? 'translate-x-0 ease-enter' : 'translate-x-full ease-exit'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-medium text-ink-100">Shift details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md border border-navy-600 px-2 py-1 text-sm leading-none text-ink-300 transition-all duration-150 hover:border-navy-500 hover:text-ink-100 active:scale-95"
          >
            ✕
          </button>
        </div>

        <dl className="mt-6 space-y-5">
          <Field label="Employee">
            {shift.employee_name}
            {isMine && <span className="ml-2 text-xs text-yellow-400">you</span>}
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
                <span className="block text-xs text-ink-500">
                  {shift.profile.email}
                </span>
              </span>
            ) : (
              <span className="text-ink-500">
                Not linked to a member yet — this shift only has a name from the
                schedule photo.
              </span>
            )}
          </Field>

          {swap && (
            <Field label="Swap request">
              <span className="capitalize">{swap.type}</span> ·{' '}
              {swap.status.replace('_', ' ')}
              {swap.requester && (
                <span className="block text-xs text-ink-500">
                  Requested by{' '}
                  {swap.requester.full_name?.trim() || swap.requester.email}
                </span>
              )}
            </Field>
          )}
        </dl>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {!shift.user_id &&
            (myClaim ? (
              <p className="rounded-lg border border-navy-700 bg-navy-950 px-3 py-2 text-sm text-ink-300">
                {myClaim.status === 'pending'
                  ? 'Claim sent — waiting for your team lead to confirm.'
                  : "Your claim for this name was approved — refresh if this shift doesn't show as yours yet."}
              </p>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={claimShift}
                className={neutralButton}
              >
                This is my shift
              </button>
            ))}

          {isMine && shift.status === 'assigned' && !swap && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => createSwap('drop')}
                className={neutralButton}
              >
                Drop this shift
              </button>

              {!tradeOpen ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setTradeOpen(true)}
                  className={neutralButton}
                >
                  Trade this shift
                </button>
              ) : (
                <div className="rounded-lg border border-navy-700 bg-navy-950 p-3">
                  <label
                    htmlFor="offeredShift"
                    className="block text-xs font-medium text-ink-300"
                  >
                    Which shift do you want in return?
                  </label>
                  <select
                    id="offeredShift"
                    value={offeredShiftId}
                    onChange={(e) => setOfferedShiftId(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-navy-600 bg-navy-900 px-2 py-1.5 text-sm text-ink-100 outline-none focus:border-yellow-400"
                  >
                    <option value="">Select a shift…</option>
                    {tradeableShifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.employee_name} · {s.date} · {formatTime(s.start_time)}–
                        {formatTime(s.end_time)}
                      </option>
                    ))}
                  </select>

                  {tradeableShifts.length === 0 && (
                    <p className="mt-2 text-xs text-ink-500">
                      No other member&apos;s shifts are available this week.
                    </p>
                  )}

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={busy || !offeredShiftId}
                      onClick={() => createSwap('trade', offeredShiftId)}
                      className={positiveButton}
                    >
                      Propose trade
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setTradeOpen(false)}
                      className={neutralButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {swap?.type === 'drop' && swap.status === 'open' && !isRequester && (
            <button
              type="button"
              disabled={busy}
              onClick={() => swapAction('claim')}
              className={positiveButton}
            >
              Claim this shift
            </button>
          )}

          {offeredToMe && (
            <button
              type="button"
              disabled={busy}
              onClick={() => swapAction('accept')}
              className={positiveButton}
            >
              Accept trade
            </button>
          )}

          {isTeamLead && swap?.status === 'pending_approval' && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => swapAction('approve')}
                className={positiveButton}
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => swapAction('reject')}
                className={destructiveButton}
              >
                Reject
              </button>
            </div>
          )}

          {isRequester && swap?.status === 'open' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => swapAction('cancel')}
              className={destructiveButton}
            >
              Cancel request
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
