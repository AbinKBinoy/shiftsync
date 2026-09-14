import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Department, Profile, UserRole } from '@/types';

type MembershipRow = {
  role: UserRole;
  joined_at: string;
  departments: Department | null;
};

export type MemberRow = {
  id: string;
  role: UserRole;
  joined_at: string;
  user_id: string;
  profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'created_at'> | null;
};

export type DashboardContext = {
  userId: string;
  userEmail: string;
  fullName: string | null;
  department: Department;
  isTeamLead: boolean;
};

// Shared by the (app) layout and every page under it: who is signed in,
// which department they belong to, and whether they lead it. Each caller
// re-runs this rather than receiving it as a prop — a layout can't pass
// custom props down to nested pages, only `children`.
export async function getDashboardContext(): Promise<DashboardContext> {
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

  const isTeamLead =
    memberships.find((m) => m.departments?.id === department.id)?.role ===
    'team_lead';

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  return {
    userId: user.id,
    userEmail: user.email ?? '',
    fullName: profile?.full_name?.trim() || null,
    department,
    isTeamLead,
  };
}

// Deliberately no email field — member addresses must not reach the client,
// same pattern as NameLinker and the Members page.
export async function getDepartmentMembers(
  departmentId: string
): Promise<MemberRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('department_members')
    .select(
      'id, role, joined_at, user_id, profiles(id, full_name, avatar_url, created_at)'
    )
    .eq('department_id', departmentId)
    .order('joined_at', { ascending: true });

  return (data ?? []) as unknown as MemberRow[];
}
