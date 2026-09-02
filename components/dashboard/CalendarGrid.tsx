'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ShiftCard from './ShiftCard';
import ShiftDetailPanel from './ShiftDetailPanel';
import {
  WEEKDAY_LABELS,
  addDays,
  formatWeekRange,
  isSameDay,
  startOfWeek,
  toISODate,
  weekDays,
} from '@/lib/dates';
import type { Shift } from '@/types';

type CalendarGridProps = {
  departmentId: string;
  currentUserId: string;
};

export default function CalendarGrid({
  departmentId,
  currentUserId,
}: CalendarGridProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState<Shift | null>(null);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const startDate = toISODate(weekStart);
  const endDate = toISODate(addDays(weekStart, 6));

  // Results are stamped with the request they answered, so loading and errors
  // derive from state rather than needing a setState inside the effect body.
  const requestKey = `${departmentId}|${startDate}|${endDate}`;
  const [result, setResult] = useState<{
    key: string;
    shifts: Shift[];
    error: string | null;
  } | null>(null);

  const settled = result?.key === requestKey ? result : null;
  const loading = settled === null;
  const shifts = useMemo(() => settled?.shifts ?? [], [settled]);
  const error = settled?.error ?? null;

  useEffect(() => {
    let active = true;

    const params = new URLSearchParams({
      department_id: departmentId,
      start_date: startDate,
      end_date: endDate,
    });

    fetch(`/api/shifts?${params}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Could not load shifts');
        return data;
      })
      .then((data) => {
        if (active) {
          setResult({ key: requestKey, shifts: data.shifts ?? [], error: null });
        }
      })
      .catch((err: Error) => {
        if (active) {
          setResult({ key: requestKey, shifts: [], error: err.message });
        }
      });

    return () => {
      active = false;
    };
  }, [departmentId, startDate, endDate, requestKey]);

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

  const goToWeek = useCallback((offset: number) => {
    setWeekStart((current) => addDays(current, offset * 7));
  }, []);

  const today = new Date();

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-300">
            {formatWeekRange(weekStart)}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            {loading
              ? 'Loading shifts…'
              : `${shifts.length} shift${shifts.length === 1 ? '' : 's'} this week`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToWeek(-1)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-50"
          >
            Previous Week
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => goToWeek(1)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-50"
          >
            Next Week
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      <div className="mt-5 overflow-x-auto">
        <div className="grid min-w-[840px] grid-cols-7 gap-2">
          {days.map((day, index) => {
            const iso = toISODate(day);
            const dayShifts = shiftsByDate.get(iso) ?? [];
            const isToday = isSameDay(day, today);

            return (
              <div
                key={iso}
                className={`flex min-h-40 flex-col rounded-lg border p-2 ${
                  isToday
                    ? 'border-zinc-600 bg-zinc-950'
                    : 'border-zinc-800 bg-zinc-950/60'
                }`}
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-xs font-medium text-zinc-400">
                    {WEEKDAY_LABELS[index]}
                  </span>
                  <span
                    className={`text-xs tabular-nums ${
                      isToday ? 'text-zinc-100' : 'text-zinc-500'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-1.5">
                  {dayShifts.length === 0 ? (
                    <p className="mt-2 text-center text-xs text-zinc-700">
                      {loading ? '' : 'No shifts'}
                    </p>
                  ) : (
                    dayShifts.map((shift) => (
                      <ShiftCard
                        key={shift.id}
                        shift={shift}
                        currentUserId={currentUserId}
                        onClick={setSelected}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ShiftDetailPanel
        shift={selected}
        currentUserId={currentUserId}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
