'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDashboard } from './DashboardData';
import { exitAnimationDelay, MOTION_MS } from '@/lib/motion';
import type { Shift } from '@/types';

function TapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M9 12.5V6a1.5 1.5 0 0 1 3 0v4.5M12 10.5V4.5a1.5 1.5 0 0 1 3 0V11M15 10.5a1.5 1.5 0 0 1 3 0V13" />
      <path d="M18 12.5V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7l-2.24-3.36a1.4 1.4 0 0 1 2.1-1.83L7 14.5" />
    </svg>
  );
}

// Fetches the whole department's shifts (no date range), independent of the
// visible week in DashboardData — the question this answers ("has this
// person ever been linked, does an unlinked name still exist to claim") is
// about the department as a whole, not this week. Same pattern NameLinker
// already uses for the same reason.
export default function ClaimNameBanner() {
  const { departmentId, currentUserId, claims } = useDashboard();

  const [allShifts, setAllShifts] = useState<Shift[] | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/shifts?department_id=${departmentId}`)
      .then((res) => (res.ok ? res.json() : { shifts: [] }))
      .then((data) => {
        if (active) setAllShifts(data.shifts ?? []);
      })
      .catch(() => {
        if (active) setAllShifts([]);
      });
    return () => {
      active = false;
    };
  }, [departmentId]);

  const { isAlreadyLinked, hasClaimableName } = useMemo(() => {
    if (!allShifts) return { isAlreadyLinked: false, hasClaimableName: false };
    return {
      isAlreadyLinked: allShifts.some((s) => s.user_id === currentUserId),
      hasClaimableName: allShifts.some((s) => !s.user_id),
    };
  }, [allShifts, currentUserId]);

  // Someone who already has a pending claim tapped their name and is
  // waiting on their team lead — re-prompting them to do it again is noise.
  const hasPendingClaim = claims.some(
    (c) => c.requested_by === currentUserId && c.status === 'pending'
  );

  const shouldShow =
    allShifts !== null && !isAlreadyLinked && !hasPendingClaim && hasClaimableName;

  // Mirrors ShiftDetailPanel's mount/exit pattern: stay rendered for one exit
  // beat after `shouldShow` goes false (dismissed, or the condition resolves
  // itself once linked) so the banner animates out instead of vanishing.
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [prevShouldShow, setPrevShouldShow] = useState(shouldShow);

  if (shouldShow !== prevShouldShow) {
    setPrevShouldShow(shouldShow);
    if (shouldShow && !dismissed) {
      setVisible(true);
    } else {
      setEntered(false);
    }
  }

  useEffect(() => {
    if (!visible) return;
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  useEffect(() => {
    if (shouldShow && !dismissed) return;
    if (!visible) return;
    const timeout = setTimeout(() => setVisible(false), exitAnimationDelay(MOTION_MS.base));
    return () => clearTimeout(timeout);
  }, [shouldShow, dismissed, visible]);

  function handleDismiss() {
    setDismissed(true);
    setEntered(false);
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      className={`mb-4 flex items-start gap-3 rounded-xl border border-yellow-500/25 bg-navy-900 px-4 py-3.5 shadow-lg shadow-black/10 transition-all duration-250 ${
        entered ? 'translate-y-0 opacity-100 ease-enter' : '-translate-y-1.5 opacity-0 ease-exit'
      }`}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-yellow-500/30 bg-navy-950 text-yellow-400">
        <TapIcon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-100">
          Find your name on the calendar and tap it to link your shifts
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-400">
          Linking lets your team know who&apos;s who, and unlocks swaps, trades, and
          &quot;my shifts&quot; for you. Open any shift with your name and choose{' '}
          <span className="text-ink-300">This is my shift</span>.
        </p>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 text-ink-500 transition-all duration-150 hover:text-ink-300 active:scale-90"
      >
        ✕
      </button>
    </div>
  );
}
