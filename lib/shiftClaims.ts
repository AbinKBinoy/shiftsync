import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// shift_claims has two FKs to profiles (requested_by, resolved_by), so
// PostgREST needs the relationship named explicitly — same reason
// SWAP_SELECT in lib/swaps.ts does this for swap_requests.
export const CLAIM_SELECT =
  '*, requester:profiles!requested_by(id,email,full_name,avatar_url,created_at),' +
  'resolver:profiles!resolved_by(id,email,full_name,avatar_url,created_at)';

export type ClaimContext = {
  admin: SupabaseClient;
  user: { id: string };
  claim: {
    id: string;
    department_id: string;
    employee_name: string;
    requested_by: string;
    status: string;
  };
};

// Shared preamble for /api/shift-claims/[id]/{approve,reject}: authenticate
// and confirm the caller is a team lead of the claim's department.
export async function loadClaimContext(
  claimId: string
): Promise<{ error: NextResponse } | ClaimContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    };
  }

  const admin = createAdminClient();

  const { data: claim } = await admin
    .from('shift_claims')
    .select('*')
    .eq('id', claimId)
    .maybeSingle();

  if (!claim) {
    return {
      error: NextResponse.json({ error: 'Claim not found' }, { status: 404 }),
    };
  }

  const { data: membership } = await admin
    .from('department_members')
    .select('role')
    .eq('department_id', claim.department_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership || membership.role !== 'team_lead') {
    return {
      error: NextResponse.json(
        { error: 'Only a team lead can resolve claims' },
        { status: 403 }
      ),
    };
  }

  return { admin, user, claim };
}

// A department maps one account to at most one name — someone linked as
// "J. Rivera" can't also become "M. Chen" in the same department. Returns
// the name they're already linked to (if any, and if it differs from the
// name they're now trying for), or null when there's no conflict. Shared by
// the claim POST route, the approve route (second line of defense in case
// another path linked them in the meantime), and the manual link endpoint.
export async function findLinkedNameConflict(
  admin: SupabaseClient,
  departmentId: string,
  userId: string,
  employeeName: string
): Promise<string | null> {
  const { data: linkedShift } = await admin
    .from('shifts')
    .select('employee_name')
    .eq('department_id', departmentId)
    .eq('user_id', userId)
    .neq('employee_name', employeeName)
    .limit(1)
    .maybeSingle();

  if (linkedShift) return linkedShift.employee_name;

  // Defensive second source: an approved claim for a different name, in case
  // no shift row happens to reflect it yet (e.g. the matching shifts were
  // since deleted, or a fresh batch under the linked name hasn't arrived).
  const { data: approvedClaim } = await admin
    .from('shift_claims')
    .select('employee_name')
    .eq('department_id', departmentId)
    .eq('requested_by', userId)
    .eq('status', 'approved')
    .neq('employee_name', employeeName)
    .limit(1)
    .maybeSingle();

  return approvedClaim?.employee_name ?? null;
}

// Links every unlinked shift with this employee_name (in this department) to
// the person whose claim was just approved — same bulk-update shape as
// POST /api/shifts/link, scoped to the one name on this claim.
export async function applyClaimApproval(
  admin: SupabaseClient,
  claim: { department_id: string; employee_name: string; requested_by: string }
): Promise<string | null> {
  const { error } = await admin
    .from('shifts')
    .update({ user_id: claim.requested_by })
    .eq('department_id', claim.department_id)
    .eq('employee_name', claim.employee_name)
    .is('user_id', null);

  return error ? error.message : null;
}

export async function returnClaim(admin: SupabaseClient, claimId: string) {
  const { data, error } = await admin
    .from('shift_claims')
    .select(CLAIM_SELECT)
    .eq('id', claimId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ claim: data });
}
