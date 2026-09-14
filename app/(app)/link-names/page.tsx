import { redirect } from 'next/navigation';
import NameLinker from '@/components/dashboard/NameLinker';
import ShiftClaimApprovals from '@/components/dashboard/ShiftClaimApprovals';
import { getDashboardContext, getDepartmentMembers } from '@/lib/department';

export default async function LinkNamesPage() {
  const { isTeamLead, department } = await getDashboardContext();

  if (!isTeamLead) {
    redirect('/calendar');
  }

  const members = await getDepartmentMembers(department.id);

  return (
    <div className="space-y-6">
      <ShiftClaimApprovals />
      <NameLinker
        isTeamLead={isTeamLead}
        members={members.map((m) => ({
          user_id: m.user_id,
          name: m.profiles?.full_name?.trim() || 'Unnamed member',
        }))}
      />
    </div>
  );
}
