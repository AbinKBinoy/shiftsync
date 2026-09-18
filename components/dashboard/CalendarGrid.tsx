'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SVGProps, TouchEvent } from 'react';
import { toast } from 'sonner';
import ShiftCard from './ShiftCard';
import { useDashboard } from './DashboardData';
import {
  WEEKDAY_LABELS,
  addDays,
  formatDayHeading,
  formatWeekRange,
  isSameDay,
  parseISODate,
  startOfWeek,
  toISODate,
  weekDays,
} from '@/lib/dates';
import type { Shift } from '@/types';

// Swipes shorter than this (in px) are treated as taps/scroll jitter, not a
// day change. Also requires the horizontal move to dominate the vertical one,
// so a vertical scroll inside the list never gets misread as a swipe.
const SWIPE_THRESHOLD_PX = 50;

// Shared focus style for controls that sit directly on the section's own
// navy-900 background, so the ring offset reads cleanly against it.
const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900';

// Shared press feedback — matters most here on touch, where :hover never
// fires at all, so this is the only acknowledgement a tap gets.
const PRESS = 'transition-all duration-150 active:scale-[0.97]';

function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export default function CalendarGrid() {
  const {
    weekStart,
    setWeekStart,
    shifts,
    shiftsLoading,
    shiftsError,
    currentUserId,
    openShift,
  } = useDashboard();

  // Which single day the mobile view is showing. Independent of weekStart
  // (which only tracks the fetched 7-day window) so day-by-day browsing can
  // land anywhere inside that window without a separate week concept.
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // shiftsError comes from DashboardData's fetch, not a local imperative
  // action — a stable id means a second failed fetch (a different week, the
  // same message) updates this one toast instead of stacking duplicates,
  // and it also absorbs React StrictMode's dev double-invoke of effects.
  useEffect(() => {
    if (shiftsError) toast.error(shiftsError, { id: 'shifts-error' });
  }, [shiftsError]);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);

  // Bucket the week's shifts by date once, rather than filtering per column.
  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const shift of shifts) {
      const list = map.get(shift.date);
      if (list) list.push(shift);
      else map.set(shift.date, [shift]);
    }
    return map;
  }, [shifts]);

  const today = new Date();

  // Desktop week nav also snaps the mobile day-view to that week's first day,
  // so shrinking to mobile mid-session lands somewhere sensible.
  function goToWeek(nextWeekStart: Date) {
    setWeekStart(nextWeekStart);
    setSelectedDate(nextWeekStart);
  }

  function goToday() {
    const now = new Date();
    setWeekStart(startOfWeek(now));
    setSelectedDate(now);
  }

  // Crossing a week boundary on mobile pulls in the adjacent week's data
  // automatically, so Previous/Next Day reads as continuous browsing rather
  // than stopping dead at the edge of whatever week happens to be loaded.
  function goToDay(nextDay: Date) {
    setSelectedDate(nextDay);
    const nextWeekStart = startOfWeek(nextDay);
    if (toISODate(nextWeekStart) !== toISODate(weekStart)) {
      setWeekStart(nextWeekStart);
    }
  }

  function handleDatePicked(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.value) return;
    goToDay(parseISODate(e.target.value));
  }

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(e: TouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    goToDay(addDays(selectedDate, deltaX < 0 ? 1 : -1));
  }

  const selectedIso = toISODate(selectedDate);
  const selectedDayShifts = shiftsByDate.get(selectedIso) ?? [];
  const isSelectedToday = isSameDay(selectedDate, today);

  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-navy-700 bg-navy-900 p-6 shadow-xl shadow-black/20">
      {/* Desktop header + week nav */}
      <div className="hidden flex-wrap items-center justify-between gap-3 md:flex">
        <div>
          <h2 className="text-sm font-medium text-ink-300">
            {formatWeekRange(weekStart)}
          </h2>
          <p className="mt-0.5 text-xs text-ink-500">
            {shiftsLoading
              ? 'Loading shifts…'
              : `${shifts.length} shift${shifts.length === 1 ? '' : 's'} this week`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToWeek(addDays(weekStart, -7))}
            className={`rounded-lg border border-navy-600 px-3 py-1.5 text-sm text-ink-300 hover:border-navy-500 hover:text-ink-100 ${PRESS} ${FOCUS_RING}`}
          >
            Previous Week
          </button>
          <button
            type="button"
            onClick={goToday}
            className={`rounded-lg border border-navy-600 px-3 py-1.5 text-sm text-ink-300 hover:border-navy-500 hover:text-ink-100 ${PRESS} ${FOCUS_RING}`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => goToWeek(addDays(weekStart, 7))}
            className={`rounded-lg border border-navy-600 px-3 py-1.5 text-sm text-ink-300 hover:border-navy-500 hover:text-ink-100 ${PRESS} ${FOCUS_RING}`}
          >
            Next Week
          </button>
        </div>
      </div>

      {/* Mobile header + day nav */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => goToDay(addDays(selectedDate, -1))}
            aria-label="Previous day"
            className={`shrink-0 rounded-lg border border-navy-600 p-2 text-ink-300 hover:border-navy-500 hover:text-ink-100 ${PRESS} ${FOCUS_RING}`}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          <div className="min-w-0 text-center">
            <div className="relative inline-flex items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-1.5 focus-within:ring-2 focus-within:ring-yellow-400 focus-within:ring-offset-2 focus-within:ring-offset-navy-900">
              <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-ink-500" />
              <p className="truncate text-sm font-medium text-ink-100">
                {formatDayHeading(selectedDate)}
              </p>
              {/* Invisible native date input sized to sit exactly over the
                  pill above — tapping it opens the OS date picker. A hidden
                  input can't reliably be opened programmatically across
                  browsers, so the input itself IS the tap target. The pill's
                  focus-within ring above gives keyboard users a visible focus
                  indicator despite the input itself being invisible. */}
              <input
                type="date"
                value={selectedIso}
                onChange={handleDatePicked}
                aria-label="Jump to a specific date"
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </div>
            {!isSelectedToday && (
              <button
                type="button"
                onClick={goToday}
                className={`mt-1 block rounded text-xs font-medium text-yellow-400 transition-all duration-150 hover:text-yellow-300 active:scale-95 ${FOCUS_RING}`}
              >
                Jump to today
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => goToDay(addDays(selectedDate, 1))}
            aria-label="Next day"
            className={`shrink-0 rounded-lg border border-navy-600 p-2 text-ink-300 hover:border-navy-500 hover:text-ink-100 ${PRESS} ${FOCUS_RING}`}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-center text-xs text-ink-500">
          {shiftsLoading
            ? 'Loading shifts…'
            : `${selectedDayShifts.length} shift${selectedDayShifts.length === 1 ? '' : 's'} today`}
        </p>
      </div>

      {/* Desktop 7-column week grid — fills remaining height so the calendar
          reads as a substantial grid rather than a small card. */}
      <div className="mt-5 hidden min-h-0 flex-1 overflow-x-auto md:block">
        <div
          key={toISODate(weekStart)}
          className="animate-block-in grid h-full min-w-[840px] auto-rows-fr grid-cols-7 gap-2"
        >
          {days.map((day, index) => {
            const iso = toISODate(day);
            const dayShifts = shiftsByDate.get(iso) ?? [];
            const isToday = isSameDay(day, today);

            return (
              <div
                key={iso}
                className={`flex min-h-40 flex-col rounded-lg border p-3 transition-colors ${
                  isToday
                    ? 'border-yellow-500/40 bg-navy-800/60 ring-1 ring-yellow-500/15'
                    : 'border-navy-800 bg-navy-950/60'
                }`}
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <span
                    className={`text-xs font-medium ${
                      isToday ? 'text-yellow-300' : 'text-ink-500'
                    }`}
                  >
                    {WEEKDAY_LABELS[index]}
                  </span>
                  <span
                    className={`text-xs tabular-nums ${
                      isToday ? 'font-semibold text-yellow-300' : 'text-ink-500'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  {dayShifts.length === 0 ? (
                    <p className="mt-2 text-center text-xs text-ink-500/60">
                      {shiftsLoading ? '' : 'No shifts'}
                    </p>
                  ) : (
                    dayShifts.map((shift) => (
                      <ShiftCard
                        key={shift.id}
                        shift={shift}
                        currentUserId={currentUserId}
                        onClick={openShift}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile single-day list — swipe left/right to change day */}
      <div
        className="mt-5 flex-1 md:hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div key={selectedIso} className="animate-block-in flex flex-col gap-2">
          {selectedDayShifts.length === 0 ? (
            <p className="rounded-lg border border-navy-800 bg-navy-950/60 py-8 text-center text-sm text-ink-500">
              {shiftsLoading ? 'Loading shifts…' : 'No shifts'}
            </p>
          ) : (
            selectedDayShifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                currentUserId={currentUserId}
                onClick={openShift}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
