import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LandingPage from '@/components/marketing/LandingPage';

export default async function Home({ searchParams }: PageProps<'/'>) {
  const supabase = await createClient();

  // Supabase's OAuth redirect lands the auth code here instead of at
  // /auth/callback when `redirectTo` isn't allow-listed in the dashboard's
  // Redirect URLs and it silently falls back to the Site URL (same failure
  // mode documented in app/auth/callback/route.ts for password resets).
  // Exchange it here too so sign-in still completes while that's misconfigured.
  const { code } = await searchParams;
  if (typeof code === 'string') {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    redirect(error ? '/login' : '/calendar');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/calendar');
  }

  return <LandingPage />;
}
