import { getDashboardContext, getDepartmentMembers } from '@/lib/department';

export default async function MembersPage() {
  const { userId, department } = await getDashboardContext();
  const members = await getDepartmentMembers(department.id);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
      <h2 className="text-sm font-medium text-zinc-300">
        Members{members.length > 0 ? ` (${members.length})` : ''}
      </h2>

      {members.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No members to show yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-800">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-100">
                  {member.profiles?.full_name?.trim() || 'Unnamed member'}
                  {member.user_id === userId && (
                    <span className="ml-2 text-xs text-zinc-500">(you)</span>
                  )}
                </p>
              </div>
              <span
                className={
                  member.role === 'team_lead'
                    ? 'shrink-0 rounded-md border border-blue-900 bg-blue-950 px-2.5 py-0.5 text-xs font-medium text-blue-300'
                    : 'shrink-0 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300'
                }
              >
                {member.role === 'team_lead' ? 'Team lead' : 'Member'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
