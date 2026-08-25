'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    // Email confirmation is off in dev, so the account is usable right away.
    // Give the confirmation message a beat to be read, then send them to login.
    setTimeout(() => router.push('/login'), 2000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-zinc-400">Get started with ShiftSync.</p>

        {success ? (
          <p
            role="status"
            className="mt-6 rounded-lg border border-green-900 bg-green-950 px-3 py-2 text-sm text-green-300"
          >
            Check your email to confirm. Redirecting you to log in…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-zinc-300"
              >
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Jordan Lee"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-300"
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
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-300"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="At least 6 characters"
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
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
