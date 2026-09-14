'use client';

import { useSignOut } from '@/lib/useSignOut';

export default function SignOutButton() {
  const { signOut, loading } = useSignOut();

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={loading}
      className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
