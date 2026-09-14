'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSignOut } from '@/lib/useSignOut';
import { NAV_ITEMS } from './navItems';

const STORAGE_KEY = 'shiftsync:sidebar-collapsed';

export default function Sidebar({
  departmentName,
  displayName,
  isTeamLead,
}: {
  departmentName: string;
  displayName: string;
  isTeamLead: boolean;
}) {
  const pathname = usePathname();
  const { signOut, loading } = useSignOut();
  const [collapsed, setCollapsed] = useState(false);

  // Read the saved choice after mount only — the server has no localStorage,
  // so starting from it here would mismatch the server-rendered markup.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      // localStorage can be unavailable (private browsing); default stands.
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // Best-effort only.
      }
      return next;
    });
  }

  const items = NAV_ITEMS.filter((item) => !item.teamLeadOnly || isTeamLead);

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 md:flex ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 p-4">
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-100">
              {departmentName}
            </p>
            <p className="truncate text-xs text-zinc-500">{displayName}</p>
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="shrink-0 rounded-md border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-100"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="h-4 w-4"
          >
            <path d={collapsed ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} />
          </svg>
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-950 text-blue-300'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-3">
        {collapsed ? (
          <button
            type="button"
            onClick={signOut}
            disabled={loading}
            aria-label="Sign out"
            title="Sign out"
            className="flex w-full items-center justify-center rounded-lg border border-zinc-700 p-2 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              className="h-5 w-5"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={signOut}
            disabled={loading}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              className="h-5 w-5 shrink-0"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>{loading ? 'Signing out…' : 'Sign out'}</span>
          </button>
        )}
      </div>
    </aside>
  );
}
