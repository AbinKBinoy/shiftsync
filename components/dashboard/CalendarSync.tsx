'use client';

import { useEffect, useState } from 'react';

export default function CalendarSync() {
  const [token, setToken] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  // Lazy initialiser rather than an effect: on the server this is '', and the
  // component renders nothing until the token arrives client-side anyway, so
  // there's no hydration mismatch.
  const [host] = useState(() =>
    typeof window === 'undefined' ? '' : window.location.host
  );

  useEffect(() => {
    let active = true;

    fetch('/api/user/calendar-token')
      .then(async (res) => {
        if (!res.ok) throw new Error('no token');
        return res.json();
      })
      .then((data) => {
        if (active) setToken(data.calendar_token ?? null);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, []);

  if (failed || !token || !host) return null;

  // webcal:// makes the OS hand the feed to whichever calendar app is installed.
  const webcalUrl = `webcal://${host}/api/calendar/${token}/feed.ics`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(webcalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
      <h2 className="text-sm font-medium text-zinc-300">Sync to your calendar</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Add this once and new shifts will appear automatically — no need to
        re-download.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={webcalUrl}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          Add to calendar
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-50"
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        Keep this link private — anyone who has it can see your shifts.
      </p>
    </section>
  );
}
