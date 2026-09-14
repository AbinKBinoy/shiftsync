import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/auth/SignOutButton';
import InviteCode from '@/components/dashboard/InviteCode';
import CalendarGrid from '@/components/dashboard/CalendarGrid';
import SwapSidebar from '@/components/dashboard/SwapSidebar';
import DashboardData from '@/components/dashboard/DashboardData';
import NameLinker from '@/components/dashboard/NameLinker';
import CalendarSync from '@/components/dashboard/CalendarSync';
import type { Department, Profile, UserRole } from '@/types';

type MembershipRow = {
  role: UserRole;
  joined_at: string;
  departments: Department | null;
};

type MemberRow = {
  id: string;
  role: UserRole;
  joined_at: string;
  user_id: string;
  profiles: Profile | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: membershipData } = await supabase
    .from('department_members')
    .select(
      'role, joined_at, departments(id, name, invite_code, created_by, require_approval, created_at)'
    )
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true });

  const memberships = (membershipData ?? []) as unknown as MembershipRow[];
  const department = memberships.find((m) => m.departments)?.departments;

  if (!department) {
    redirect('/department');
  }

  // Deliberately no email field — member addresses must not reach this page,
  // same pattern as NameLinker.
  const { data: memberData } = await supabase
    .from('department_members')
    .select('id, role, joined_at, user_id, profiles(id, full_name, avatar_url, created_at)')
    .eq('department_id', department.id)
    .order('joined_at', { ascending: true });

  const members = (memberData ?? []) as unknown as MemberRow[];

  const isTeamLead =
    memberships.find((m) => m.departments?.id === department.id)?.role ===
    'team_lead';

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
              {department.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Signed in as <span className="text-zinc-200">{user.email}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/upload"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              Upload Schedule
            </Link>
            <SignOutButton />
          </div>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
          <h2 className="text-sm font-medium text-zinc-300">Invite code</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Share this with teammates so they can join.
          </p>
          <div className="mt-3">
            <InviteCode code={department.invite_code} />
          </div>
        </section>

        <CalendarSync />

        <DashboardData
          departmentId={department.id}
          currentUserId={user.id}
          isTeamLead={isTeamLead}
        >
          <NameLinker
            isTeamLead={isTeamLead}
            members={members.map((m) => ({
              user_id: m.user_id,
              name: m.profiles?.full_name?.trim() || 'Unnamed member',
            }))}
          />
          <CalendarGrid />
          <SwapSidebar />
        </DashboardData>

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
                      {member.user_id === user.id && (
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
      </div>
    </div>
  );
}
