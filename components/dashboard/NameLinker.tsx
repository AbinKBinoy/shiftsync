'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDashboard } from './DashboardData';
import type { Shift } from '@/types';

// Deliberately no email field — member addresses must not reach this component.
export type LinkableMember = {
  user_id: string;
  name: string;
};

export default function NameLinker({
  members,
  isTeamLead,
}: {
  members: LinkableMember[];
  isTeamLead: boolean;
}) {
  const { departmentId, refresh } = useDashboard();

  const [reloadToken, setReloadToken] = useState(0);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // Unlinked shifts span the whole schedule, not just the visible week, so this
  // fetches independently of the calendar.
  const requestKey = `${departmentId}|${reloadToken}`;
  const [loaded, setLoaded] = useState<{ key: string; shifts: Shift[] } | null>(
    null
  );

  useEffect(() => {
    if (!isTeamLead) return;
    let active = true;

    fetch(`/api/shifts?department_id=${departmentId}`)
      .then(async (res) => (res.ok ? res.json() : { shifts: [] }))
      .then((data) => {
        if (active) setLoaded({ key: requestKey, shifts: data.shifts ?? [] });
      })
      .catch(() => {
        if (active) setLoaded({ key: requestKey, shifts: [] });
      });

    return () => {
      active = false;
    };
  }, [departmentId, requestKey, isTeamLead]);

  const settled = loaded?.key === requestKey ? loaded : null;
  const allShifts = useMemo(() => settled?.shifts ?? [], [settled]);

  const { unlinkedNames, totalNames } = useMemo(() => {
    const allNames = new Set<string>();
    const unlinked = new Map<string, number>();

    for (const shift of allShifts) {
      allNames.add(shift.employee_name);

      // Only names that still have an unlinked shift belong in the list; a name
      // can appear in both states, so count shifts rather than names here.
      if (!shift.user_id) {
        unlinked.set(
          shift.employee_name,
          (unlinked.get(shift.employee_name) ?? 0) + 1
        );
      }
    }

    return {
      unlinkedNames: [...unlinked.entries()].sort((a, b) =>
        a[0].localeCompare(b[0])
      ),
      totalNames: allNames.size,
    };
  }, [allShifts]);

  async function handleLinkAll() {
    const links = Object.entries(assignments)
      .filter(([, userId]) => userId)
      .map(([employee_name, user_id]) => ({ employee_name, user_id }));

    if (links.length === 0) {
      setError('Match at least one name to a member first.');
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/shifts/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department_id: departmentId, links }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Linking failed');
        return;
      }

      setResult(`Linked ${data.updated} shift${data.updated === 1 ? '' : 's'}.`);
      setAssignments({});
      setReloadToken((t) => t + 1);
      refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  // Linking is a team lead tool, and there's nothing to do once every name has
  // an account.
  if (!isTeamLead) return null;
  if (!settled) return null;
  if (unlinkedNames.length === 0) return null;

  const linkedCount = totalNames - unlinkedNames.length;
  const selectedCount = Object.values(assignments).filter(Boolean).length;

  return (
    <section className="rounded-2xl border border-navy-700 bg-navy-900 p-6 shadow-xl shadow-black/20">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-ink-300">Link names to accounts</h2>
        <span className="text-xs text-ink-500">
          {linkedCount} of {totalNames} names linked
        </span>
      </div>

      <p className="mt-1 text-sm text-ink-500">
        Shifts read off a photo only carry a name. Match each one to a member so
        swaps and “my shifts” work.
      </p>

      <ul className="mt-4 space-y-2">
        {unlinkedNames.map(([name, count]) => (
          <li
            key={name}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-navy-700 bg-navy-950 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-ink-100">{name}</p>
              <p className="text-xs text-ink-500">
                {count} shift{count === 1 ? '' : 's'}
              </p>
            </div>

            <select
              aria-label={`Link ${name} to a member`}
              value={assignments[name] ?? ''}
              onChange={(e) =>
                setAssignments((prev) => ({ ...prev, [name]: e.target.value }))
              }
              className="min-w-52 rounded-lg border border-navy-600 bg-navy-900 px-2 py-1.5 text-sm text-ink-100 outline-none focus:border-yellow-400"
            >
              <option value="">Not linked</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.name}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {result && (
        <p className="mt-4 rounded-lg border border-green-900 bg-green-950 px-3 py-2 text-sm text-green-300">
          {result}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleLinkAll}
          disabled={busy || selectedCount === 0}
          className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Linking…' : 'Link All'}
        </button>
        <span className="text-xs text-ink-500">
          {selectedCount} name{selectedCount === 1 ? '' : 's'} ready to link
        </span>
      </div>
    </section>
  );
}
