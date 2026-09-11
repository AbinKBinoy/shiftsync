import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// The embed needs explicit FK names: swap_requests points at shifts twice and
// at profiles three times, so PostgREST can't pick a relationship on its own.
export const SWAP_SELECT =
  '*, requester:profiles!requester_id(id,email,full_name,avatar_url,created_at),' +
  'responder:profiles!responder_id(id,email,full_name,avatar_url,created_at),' +
  'original_shift:shifts!original_shift_id(*),' +
  'offered_shift:shifts!offered_shift_id(*)';

export const ACTIVE_SWAP_STATUSES = ['open', 'claimed', 'pending_approval'];

type ShiftRow = {
  id: string;
  user_id: string | null;
  employee_name: string;
  status: string;
};

// Shifts imported from a photo often have no linked account yet, so fall back to
// matching the name that was read off the schedule.
export function ownsShift(
  shift: Pick<ShiftRow, 'user_id' | 'employee_name'>,
  userId: string,
  fullName: string | null | undefined
): boolean {
  if (shift.user_id) return shift.user_id === userId;

  const onShift = (shift.employee_name ?? '').trim().toLowerCase();
  const onProfile = (fullName ?? '').trim().toLowerCase();
  return onShift.length > 0 && onShift === onProfile;
}

// Never falls back to email: this value is written into shifts.employee_name,
// which every member of the department can see on the calendar.
export function displayName(
  profile: { full_name?: string | null } | null
): string {
  return profile?.full_name?.trim() || 'Unnamed member';
}

export type ActionContext = {
  admin: SupabaseClient;
  user: { id: string };
  profile: { id: string; email: string; full_name: string } | null;
  swap: Record<string, unknown> & {
    id: string;
    department_id: string;
    requester_id: string;
    responder_id: string | null;
    original_shift_id: string;
    offered_shift_id: string | null;
    type: string;
    status: string;
  };
  department: { id: string; require_approval: boolean };
  role: string;
};

// Shared preamble for every /api/swaps/[id]/* route: authenticate, load the
// swap, and confirm the caller belongs to the swap's department.
export async function loadSwapContext(
  swapId: string
): Promise<{ error: NextResponse } | ActionContext> {
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

  const { data: swap } = await admin
    .from('swap_requests')
    .select('*')
    .eq('id', swapId)
    .maybeSingle();

  if (!swap) {
    return {
      error: NextResponse.json({ error: 'Swap request not found' }, { status: 404 }),
    };
  }

  const { data: membership } = await admin
    .from('department_members')
    .select('role')
    .eq('department_id', swap.department_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return {
      error: NextResponse.json(
        { error: 'You are not a member of this department' },
        { status: 403 }
      ),
    };
  }

  const { data: department } = await admin
    .from('departments')
    .select('id, require_approval')
    .eq('id', swap.department_id)
    .maybeSingle();

  if (!department) {
    return {
      error: NextResponse.json({ error: 'Department not found' }, { status: 404 }),
    };
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', user.id)
    .maybeSingle();

  return { admin, user, profile, swap, department, role: membership.role };
}

// Moves the shifts once a swap is actually approved. Drop hands the original
// shift to the responder; trade exchanges the two shifts between both parties.
export async function applySwapOutcome(
  admin: SupabaseClient,
  swap: ActionContext['swap']
): Promise<string | null> {
  const { data: responderProfile } = await admin
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', swap.responder_id)
    .maybeSingle();

  const { data: requesterProfile } = await admin
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', swap.requester_id)
    .maybeSingle();

  if (swap.type === 'drop') {
    const { error } = await admin
      .from('shifts')
      .update({
        user_id: swap.responder_id,
        employee_name: displayName(responderProfile),
        status: 'assigned',
      })
      .eq('id', swap.original_shift_id);

    return error ? error.message : null;
  }

  if (!swap.offered_shift_id) {
    return 'This trade has no offered shift to exchange.';
  }

  // Trade: each shift moves to the other party.
  const { error: originalError } = await admin
    .from('shifts')
    .update({
      user_id: swap.responder_id,
      employee_name: displayName(responderProfile),
      status: 'assigned',
    })
    .eq('id', swap.original_shift_id);

  if (originalError) return originalError.message;

  const { error: offeredError } = await admin
    .from('shifts')
    .update({
      user_id: swap.requester_id,
      employee_name: displayName(requesterProfile),
      status: 'assigned',
    })
    .eq('id', swap.offered_shift_id);

  return offeredError ? offeredError.message : null;
}

// Puts a shift back the way it was when a swap is rejected or cancelled.
export async function releaseShift(admin: SupabaseClient, shiftId: string) {
  await admin.from('shifts').update({ status: 'assigned' }).eq('id', shiftId);
}

export async function returnSwap(admin: SupabaseClient, swapId: string) {
  const { data, error } = await admin
    .from('swap_requests')
    .select(SWAP_SELECT)
    .eq('id', swapId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ swap: data });
}
