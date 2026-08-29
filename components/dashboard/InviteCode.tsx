'use client';

import { useState } from 'react';

export default function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <code className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 font-mono text-base tracking-[0.3em] text-blue-400">
        {code}
      </code>
      <button
        type="button"
        onClick={copy}
        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-50"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
