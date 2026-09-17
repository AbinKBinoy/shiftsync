import { redirect } from 'next/navigation';
import DepartmentSettings from '@/components/dashboard/DepartmentSettings';
import { getDashboardContext } from '@/lib/department';

export default async function SettingsPage() {
  const { isTeamLead, department } = await getDashboardContext();

  if (!isTeamLead) {
    redirect('/calendar');
  }

  return (
    <DepartmentSettings
      departmentId={department.id}
      departmentName={department.name}
      initialRequireApproval={department.require_approval}
    />
  );
}
