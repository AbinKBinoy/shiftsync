'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSignOut } from '@/lib/useSignOut';
import { NAV_ITEMS } from './navItems';

export default function BottomNav({ isTeamLead }: { isTeamLead: boolean }) {
  const pathname = usePathname();
  const { signOut, loading } = useSignOut();

  const items = NAV_ITEMS.filter((item) => !item.teamLeadOnly || isTeamLead);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-navy-800 bg-navy-900 md:hidden">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-all duration-150 active:scale-95 ${
              active ? 'text-yellow-400' : 'text-ink-500'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={signOut}
        disabled={loading}
        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-ink-500 transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
        <span>{loading ? '…' : 'Sign out'}</span>
      </button>
    </nav>
  );
}
