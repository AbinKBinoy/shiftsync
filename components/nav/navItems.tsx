import type { ComponentType, SVGProps } from 'react';

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  teamLeadOnly?: boolean;
};

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function SwapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M4 7h13l-3-3M20 17H7l3 3" />
    </svg>
  );
}

function MembersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6M16 9c1.7 0 3 1.3 3 3M17.5 14c2 .3 3.5 1.9 3.5 4" />
    </svg>
  );
}

function LinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M9 15l6-6M8 12l-2 2a3 3 0 104 4l2-2M16 12l2-2a3 3 0 10-4-4l-2 2" />
    </svg>
  );
}

function SyncIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3M16 5h4V1M8 19H4v4" />
    </svg>
  );
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { href: '/open-shifts', label: 'Open Shifts', icon: SwapIcon },
  { href: '/members', label: 'Members', icon: MembersIcon },
  { href: '/link-names', label: 'Link Names', icon: LinkIcon, teamLeadOnly: true },
  { href: '/sync', label: 'Sync Calendar', icon: SyncIcon },
];
