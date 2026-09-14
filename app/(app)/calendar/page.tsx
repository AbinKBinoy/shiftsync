import Link from 'next/link';
import CalendarGrid from '@/components/dashboard/CalendarGrid';

// "Upload Schedule" lived next to the department header on the old combined
// dashboard page — kept here, on the new home page, so the feature isn't
// lost even though it's not one of the main nav items.
export default function CalendarPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex justify-end">
        <Link
          href="/upload"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          Upload Schedule
        </Link>
      </div>
      <CalendarGrid />
    </div>
  );
}
