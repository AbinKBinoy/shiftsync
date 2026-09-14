'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { GoogleIcon } from '@/components/marketing/icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Send first-time users to create or join a department; everyone else
    // straight to their calendar.
    let destination = '/department';
    try {
      const res = await fetch('/api/departments');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.departments) && data.departments.length > 0) {
          destination = '/calendar';
        }
      }
    } catch {
      // If the check fails, the (app) layout redirects to /department when needed.
      destination = '/calendar';
    }

    router.push(destination);
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-navy-700 bg-navy-900 p-8 shadow-xl">
        <Link href="/" className="text-base font-bold tracking-tight text-ink-100">
          Shift<span className="text-yellow-400">Sync</span>
        </Link>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink-100">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-ink-500">Log in to your ShiftSync account.</p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-lg border border-ink-500/30 bg-ink-100 px-4 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleIcon className="h-4.5 w-4.5" />
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-navy-700" />
          <span className="text-xs font-medium text-ink-500">OR</span>
          <div className="h-px flex-1 bg-navy-700" />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-ink-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-navy-600 bg-navy-950 px-3 py-2 text-sm text-ink-100 placeholder-ink-500 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink-300"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-yellow-400 hover:text-yellow-300"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-navy-600 bg-navy-950 px-3 py-2 text-sm text-ink-100 placeholder-ink-500 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-yellow-400 hover:text-yellow-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
