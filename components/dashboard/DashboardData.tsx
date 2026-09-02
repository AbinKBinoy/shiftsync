'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import ShiftDetailPanel from './ShiftDetailPanel';
import { addDays, parseISODate, startOfWeek, toISODate } from '@/lib/dates';
import type { Shift, SwapRequest } from '@/types';

type DashboardValue = {
  departmentId: string;
  currentUserId: string;
  isTeamLead: boolean;
  weekStart: Date;
  setWeekStart: (date: Date) => void;
  shifts: Shift[];
  shiftsLoading: boolean;
  shiftsError: string | null;
  swaps: SwapRequest[];
  swapsLoading: boolean;
  openShift: (shift: Shift) => void;
  refresh: () => void;
  swapForShift: (shiftId: string) => SwapRequest | null;
};

const DashboardContext = createContext<DashboardValue | null>(null);

export function useDashboard(): DashboardValue {
  const value = useContext(DashboardContext);
  if (!value) {
    throw new Error('useDashboard must be used inside <DashboardData>');
  }
  return value;
}

const ACTIVE = ['open', 'claimed', 'pending_approval'];

export default function DashboardData({
  departmentId,
  currentUserId,
  isTeamLead,
  children,
}: {
  departmentId: string;
  currentUserId: string;
  isTeamLead: boolean;
  children: React.ReactNode;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState<Shift | null>(null);
  // Bumped after any swap action so both the calendar and the sidebar refetch.
  const [token, setToken] = useState(0);

  const startDate = toISODate(weekStart);
  const endDate = toISODate(addDays(weekStart, 6));

  // Results carry the key of the request they answered, so loading is derived
  // rather than set from inside an effect.
  const shiftsKey = `${departmentId}|${startDate}|${endDate}|${token}`;
  const [shiftsResult, setShiftsResult] = useState<{
    key: string;
    shifts: Shift[];
    error: string | null;
  } | null>(null);

  const swapsKey = `${departmentId}|${token}`;
  const [swapsResult, setSwapsResult] = useState<{
    key: string;
    swaps: SwapRequest[];
  } | null>(null);

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
          setShiftsResult({ key: shiftsKey, shifts: data.shifts ?? [], error: null });
        }
      })
      .catch((err: Error) => {
        if (active) {
          setShiftsResult({ key: shiftsKey, shifts: [], error: err.message });
        }
      });

    return () => {
      active = false;
    };
  }, [departmentId, startDate, endDate, shiftsKey]);

  useEffect(() => {
    let active = true;

    fetch(`/api/swaps?department_id=${departmentId}`)
      .then(async (res) => (res.ok ? res.json() : { swaps: [] }))
      .then((data) => {
        if (active) setSwapsResult({ key: swapsKey, swaps: data.swaps ?? [] });
      })
      .catch(() => {
        if (active) setSwapsResult({ key: swapsKey, swaps: [] });
      });

    return () => {
      active = false;
    };
  }, [departmentId, swapsKey]);

  const settledShifts = shiftsResult?.key === shiftsKey ? shiftsResult : null;
  const settledSwaps = swapsResult?.key === swapsKey ? swapsResult : null;

  const shifts = useMemo(() => settledShifts?.shifts ?? [], [settledShifts]);
  const swaps = useMemo(() => settledSwaps?.swaps ?? [], [settledSwaps]);

  const refresh = useCallback(() => setToken((t) => t + 1), []);

  // Jump to the shift's week if it isn't the one on screen, then open it.
  const openShift = useCallback(
    (shift: Shift) => {
      const shiftWeek = startOfWeek(parseISODate(shift.date));
      setWeekStart((current) =>
        toISODate(current) === toISODate(shiftWeek) ? current : shiftWeek
      );
      setSelected(shift);
    },
    []
  );

  const swapForShift = useCallback(
    (shiftId: string) =>
      swaps.find(
        (s) =>
          ACTIVE.includes(s.status) &&
          (s.original_shift_id === shiftId || s.offered_shift_id === shiftId)
      ) ?? null,
    [swaps]
  );

  // Keep the open panel in step with freshly fetched data.
  const selectedShift = useMemo(() => {
    if (!selected) return null;
    return shifts.find((s) => s.id === selected.id) ?? selected;
  }, [selected, shifts]);

  const value: DashboardValue = {
    departmentId,
    currentUserId,
    isTeamLead,
    weekStart,
    setWeekStart,
    shifts,
    shiftsLoading: settledShifts === null,
    shiftsError: settledShifts?.error ?? null,
    swaps,
    swapsLoading: settledSwaps === null,
    openShift,
    refresh,
    swapForShift,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
      <ShiftDetailPanel
        shift={selectedShift}
        onClose={() => setSelected(null)}
      />
    </DashboardContext.Provider>
  );
}
