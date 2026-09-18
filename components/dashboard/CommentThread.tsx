'use client';

import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/lib/dates';
import type { Comment, CommentTargetType } from '@/types';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CommentThread({
  targetType,
  targetId,
}: {
  targetType: CommentTargetType;
  targetId: string;
}) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  // Comments present at load render at rest; only ones added after that (by
  // this client, this session) get the entrance animation — otherwise
  // opening a thread with a long history would animate the whole thing in
  // at once instead of just what's actually new. Real state, not a ref, so
  // reading it during render (below) doesn't trip react-hooks/refs.
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);

  // Switching targets (a different shift's panel opens) needs comments and
  // newlyAddedIds cleared before the new thread's own data arrives — done
  // here, synchronously during render on the prop change, rather than as a
  // synchronous setState call inside the effect body below.
  const targetKey = `${targetType}|${targetId}`;
  const [loadedKey, setLoadedKey] = useState(targetKey);
  if (targetKey !== loadedKey) {
    setLoadedKey(targetKey);
    setComments(null);
    setNewlyAddedIds(new Set());
  }

  useEffect(() => {
    let active = true;

    const params = new URLSearchParams({ target_type: targetType, target_id: targetId });
    fetch(`/api/comments?${params}`)
      .then((res) => (res.ok ? res.json() : { comments: [] }))
      .then((data) => {
        if (active) setComments(data.comments ?? []);
      })
      .catch(() => {
        if (active) setComments([]);
      });

    return () => {
      active = false;
    };
  }, [targetType, targetId]);

  // Scrolls the comment list itself, not the panel it lives in — a plain
  // scrollTop set rather than scrollIntoView, which would happily walk up
  // and scroll the whole slide-out panel too.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [comments?.length]);

  async function handleSend() {
    const content = text.trim();
    // comments === null means the initial load hasn't resolved yet —
    // sending now would risk that load overwriting this comment on arrival.
    if (!content || sending || comments === null) return;

    setSending(true);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: targetType, target_id: targetId, content }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error ?? 'Could not post that comment');
        return;
      }

      setComments((prev) => [...(prev ?? []), data.comment]);
      setNewlyAddedIds((prev) => new Set(prev).add(data.comment.id));
      setText('');
    } catch {
      toast.error('Could not reach the server. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  }

  const canSend = !sending && comments !== null && text.trim().length > 0;

  return (
    <div>
      <div ref={listRef} className="max-h-80 space-y-4 overflow-y-auto pr-1">
        {comments === null ? (
          <p className="py-4 text-center text-sm text-ink-500">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-500">
            No comments yet. Be the first to say something.
          </p>
        ) : (
          comments.map((c) => {
            const name = c.profile?.full_name?.trim() || 'Unnamed member';
            const isNew = newlyAddedIds.has(c.id);

            return (
              <div
                key={c.id}
                className={`flex items-start gap-3 ${isNew ? 'animate-block-in' : ''}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs font-semibold text-navy-950">
                  {initials(name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-sm font-medium text-ink-100">{name}</span>
                    <span className="shrink-0 text-xs text-ink-500">
                      {formatRelativeTime(c.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-300">
                    {c.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          placeholder="Write a comment…"
          aria-label="Write a comment"
          className="flex-1 rounded-lg border border-navy-600 bg-navy-950 px-3 py-2 text-sm text-ink-100 outline-none placeholder:text-ink-500 focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="shrink-0 rounded-lg bg-yellow-400 px-3 py-2 text-sm font-semibold text-navy-950 transition-all duration-150 hover:bg-yellow-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
