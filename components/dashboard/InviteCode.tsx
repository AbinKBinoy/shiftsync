'use client';

import { toast } from 'sonner';

export default function InviteCode({ code }: { code: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Invite code copied');
    } catch {
      toast.error('Could not copy the invite code');
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code className="rounded-lg border border-navy-700 bg-navy-950 px-3 py-1.5 font-mono text-base tracking-[0.3em] text-yellow-400">
        {code}
      </code>
      <button
        type="button"
        onClick={copy}
        className="rounded-lg border border-navy-600 px-3 py-1.5 text-sm text-ink-300 transition-colors hover:border-navy-500 hover:text-ink-100"
      >
        Copy
      </button>
    </div>
  );
}
