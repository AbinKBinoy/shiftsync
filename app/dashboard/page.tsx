import { redirect } from 'next/navigation';

// The dashboard was split into separate pages under app/(app)/. This route
// stays as a redirect so any bookmarked or hardcoded /dashboard link still
// lands somewhere useful.
export default function DashboardRedirect() {
  redirect('/calendar');
}
