'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDashboard } from './DashboardData';
import type { Shift } from '@/types';

export type LinkableMember = {
  user_id: string;
  name: string;
  email: string;
};

export default function NameLinker({ members }: { members: LinkableMember[] }) {
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
  }, [departmentId, requestKey]);

  const settled = loaded?.key === requestKey ? loaded : null;
  const allShifts = useMemo(() => settled?.shifts ?? [], [settled]);

  const { unlinkedNames, linkedNames } = useMemo(() => {
    const unlinked = new Map<string, number>();
    const linked = new Set<string>();

    for (const shift of allShifts) {
      if (shift.user_id) {
        linked.add(shift.employee_name);
      } else {
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
      linkedNames: linked,
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

  // Nothing to do once every name has an account.
  if (settled && unlinkedNames.length === 0) return null;
  if (!settled) return null;

  const totalNames = unlinkedNames.length + linkedNames.size;
  const selectedCount = Object.values(assignments).filter(Boolean).length;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-zinc-300">Link names to accounts</h2>
        <span className="text-xs text-zinc-500">
          {linkedNames.size} of {totalNames} names linked
        </span>
      </div>

      <p className="mt-1 text-sm text-zinc-500">
        Shifts read off a photo only carry a name. Match each one to a member so
        swaps and “my shifts” work.
      </p>

      <ul className="mt-4 space-y-2">
        {unlinkedNames.map(([name, count]) => (
          <li
            key={name}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-zinc-100">{name}</p>
              <p className="text-xs text-zinc-500">
                {count} shift{count === 1 ? '' : 's'}
              </p>
            </div>

            <select
              aria-label={`Link ${name} to a member`}
              value={assignments[name] ?? ''}
              onChange={(e) =>
                setAssignments((prev) => ({ ...prev, [name]: e.target.value }))
              }
              className="min-w-52 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
            >
              <option value="">Not linked</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.name} ({m.email})
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
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Linking…' : 'Link All'}
        </button>
        <span className="text-xs text-zinc-500">
          {selectedCount} name{selectedCount === 1 ? '' : 's'} ready to link
        </span>
      </div>
    </section>
  );
}
