'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function useSignOut() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    router.push('/login');
    router.refresh();
  }

  return { signOut, loading };
}
