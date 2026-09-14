import { redirect } from 'next/navigation';
import NameLinker from '@/components/dashboard/NameLinker';
import { getDashboardContext, getDepartmentMembers } from '@/lib/department';

export default async function LinkNamesPage() {
  const { isTeamLead, department } = await getDashboardContext();

  if (!isTeamLead) {
    redirect('/calendar');
  }

  const members = await getDepartmentMembers(department.id);

  return (
    <NameLinker
      isTeamLead={isTeamLead}
      members={members.map((m) => ({
        user_id: m.user_id,
        name: m.profiles?.full_name?.trim() || 'Unnamed member',
      }))}
    />
  );
}
