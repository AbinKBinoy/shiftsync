import Link from 'next/link';
import CalendarGrid from '@/components/dashboard/CalendarGrid';

// "Upload Schedule" lived next to the department header on the old combined
// dashboard page — kept here, on the new home page, so the feature isn't
// lost even though it's not one of the main nav items.
export default function CalendarPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink-100">Calendar</h1>
        <Link
          href="/upload"
          className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-navy-950 transition-all duration-150 hover:-translate-y-0.5 hover:bg-yellow-300 active:translate-y-0 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          Upload Schedule
        </Link>
      </div>
      <CalendarGrid />
    </div>
  );
}
