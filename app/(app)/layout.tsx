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
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar
        departmentName={department.name}
        displayName={fullName || userEmail}
        isTeamLead={isTeamLead}
      />

      {/* Sidebar carries its own bell on desktop; BottomNav has no room to
          spare, so mobile gets a small floating bell instead. */}
      <NotificationBell className="fixed right-4 top-4 z-40 md:hidden" />

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
