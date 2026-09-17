'use client';

import { useState } from 'react';

// A plain on/off state change with no gesture behind it — a simple CSS
// transition on the thumb's position is the right amount of motion (per the
// same fluid-interface reasoning used elsewhere in this app: bounce is
// earned by gesture momentum, not a settings toggle).
function ApprovalToggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-yellow-400' : 'bg-navy-700'
      }`}
    >
      {/* left-0.5 is explicit rather than left as "auto" on purpose — a
          button's default content alignment gives an absolutely positioned
          child with no left/right set a nonzero static position, which threw
          this off the track entirely before. Pinning left here makes the
          translate below the only thing that ever moves it. */}
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-navy-950 transition-transform duration-150 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function DepartmentSettings({
  departmentId,
  departmentName,
  initialRequireApproval,
}: {
  departmentId: string;
  departmentName: string;
  initialRequireApproval: boolean;
}) {
  const [requireApproval, setRequireApproval] = useState(initialRequireApproval);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  async function handleToggle() {
    const next = !requireApproval;
    // Flips immediately (optimistic) — the toggle itself is the feedback;
    // it reverts below only if the save actually fails.
    setRequireApproval(next);
    setSaving(true);
    setError(null);
    setJustSaved(false);

    try {
      const res = await fetch(`/api/departments/${departmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ require_approval: next }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setRequireApproval(!next);
        setError(data.error ?? 'Could not save that change');
        return;
      }

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch {
      setRequireApproval(!next);
      setError('Could not reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-navy-700 bg-navy-900 p-6 shadow-xl shadow-black/20">
      <h2 className="text-sm font-medium text-ink-300">Department</h2>

      <div className="mt-3">
        <p className="text-xs uppercase tracking-wide text-ink-500">Name</p>
        <p className="mt-1 text-sm text-ink-100">{departmentName}</p>
      </div>

      <div className="mt-6 border-t border-navy-800 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-100">
              Require team lead approval
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              {requireApproval
                ? 'When on, a swap or claimed shift needs your approval before it takes effect.'
                : 'When off, members can drop, trade, and claim shifts directly, without waiting on you.'}
            </p>
          </div>

          <ApprovalToggle
            checked={requireApproval}
            disabled={saving}
            onChange={handleToggle}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        {justSaved && !error && (
          <p className="mt-4 text-xs text-ink-500">Saved.</p>
        )}
      </div>
    </section>
  );
}
