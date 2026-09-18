'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export function useSignOut() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error('Could not sign out. Please try again.');
        return;
      }

      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return { signOut, loading };
}
