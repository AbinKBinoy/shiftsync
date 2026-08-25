'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
