import Sidebar from '@/components/nav/Sidebar';
import BottomNav from '@/components/nav/BottomNav';
import NotificationBell from '@/components/nav/NotificationBell';
import DashboardData from '@/components/dashboard/DashboardData';
import { getDashboardContext } from '@/lib/department';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, userEmail, fullName, department, isTeamLead } =
    await getDashboardContext();

  return (
    // overflow-x-hidden is scoped to this authenticated app shell rather than
    // the shared root layout on purpose: the marketing landing page (a
    // completely separate route tree, rendered from app/page.tsx) has a
    // position: sticky pinned section, and giving ANY ancestor of a sticky
    // element a non-visible overflow value — even one that never actually
    // needs to scroll, like this min-h-screen div — makes that ancestor
    // sticky's positioning containing block per spec, which breaks it if
    // that ancestor doesn't genuinely track scroll offset. This route group
    // has no sticky descendants, so it's safe to contain overflow here.
    <div className="flex min-h-screen overflow-x-hidden bg-navy-950">
      <Sidebar
        departmentName={department.name}
        displayName={fullName || userEmail}
        isTeamLead={isTeamLead}
      />

      {/* Sidebar carries its own bell on desktop; BottomNav has no room to
          spare, so mobile gets a small floating bell instead. top-20 clears
          every (app) page's first header row (e.g. Calendar's "Upload
          Schedule" button sits around y=24-60px given main's py-6) so the
          bell doesn't sit on top of page content. */}
      <NotificationBell className="fixed right-4 top-20 z-40 md:hidden" />

      <div className="flex-1 pb-16 md:pb-0">
        <DashboardData
          departmentId={department.id}
          currentUserId={userId}
          isTeamLead={isTeamLead}
        >
          <main className="mx-auto h-full w-full max-w-6xl px-4 py-6 md:px-8">
            {children}
          </main>
        </DashboardData>
      </div>

      <BottomNav isTeamLead={isTeamLead} />
    </div>
  );
}
