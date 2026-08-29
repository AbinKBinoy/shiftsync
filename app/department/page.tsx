'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Department } from '@/types';

const inputClass =
  'mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

const errorClass =
  'rounded-lg border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300';

const primaryButtonClass =
  'w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50';

export default function DepartmentPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Department | null>(null);
  const [copied, setCopied] = useState(false);

  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState<{
    department: Department;
    message: string;
  } | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();

    if (!res.ok) {
      setCreateError(data.error ?? 'Could not create department');
      setCreating(false);
      return;
    }

    setCreated(data.department);
    setCreating(false);
  }

  async function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setJoinError(null);
    setJoining(true);

    const res = await fetch('/api/departments/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_code: inviteCode }),
    });
    const data = await res.json();

    if (!res.ok) {
      setJoinError(data.error ?? 'Could not join department');
      setJoining(false);
      return;
    }

    setJoined({ department: data.department, message: data.message });
    setJoining(false);
  }

  async function copyCode() {
    if (!created) return;
    await navigator.clipboard.writeText(created.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function goToDashboard() {
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Get set up
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Create a department for your team, or join one with an invite code.
          </p>
        </div>

        {/* Create a Department */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
          <h2 className="text-lg font-medium text-zinc-50">
            Create a Department
          </h2>

          {created ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-zinc-300">
                <span className="font-medium text-zinc-50">{created.name}</span>{' '}
                is ready. Share this invite code with your team:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-center font-mono text-xl tracking-[0.3em] text-blue-400">
                  {created.invite_code}
                </code>
                <button
                  type="button"
                  onClick={copyCode}
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-50"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <button
                type="button"
                onClick={goToDashboard}
                className={primaryButtonClass}
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="departmentName"
                  className="block text-sm font-medium text-zinc-300"
                >
                  Department name
                </label>
                <input
                  id="departmentName"
                  name="departmentName"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Grocery — Evenings"
                />
              </div>

              {createError && (
                <p role="alert" className={errorClass}>
                  {createError}
                </p>
              )}

              <button
                type="submit"
                disabled={creating}
                className={primaryButtonClass}
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </form>
          )}
        </section>

        {/* Join a Department */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
          <h2 className="text-lg font-medium text-zinc-50">Join a Department</h2>

          {joined ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-zinc-300">{joined.message}</p>
              <p className="text-lg font-medium text-zinc-50">
                {joined.department.name}
              </p>
              <button
                type="button"
                onClick={goToDashboard}
                className={primaryButtonClass}
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="inviteCode"
                  className="block text-sm font-medium text-zinc-300"
                >
                  Invite code
                </label>
                <input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  required
                  maxLength={6}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className={`${inputClass} font-mono uppercase tracking-[0.3em]`}
                  placeholder="ABC234"
                />
              </div>

              {joinError && (
                <p role="alert" className={errorClass}>
                  {joinError}
                </p>
              )}

              <button
                type="submit"
                disabled={joining}
                className={primaryButtonClass}
              >
                {joining ? 'Joining…' : 'Join'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
