import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/auth/SignOutButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Welcome to ShiftSync
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Signed in as <span className="text-zinc-200">{user.email}</span>
        </p>
        <div className="mt-6">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
