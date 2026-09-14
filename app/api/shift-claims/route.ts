import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CLAIM_SELECT } from '@/lib/shiftClaims';
import { sendShiftClaimNotification } from '@/lib/email';
import type { ShiftClaim } from '@/types';

type TeamLeadRow = { profiles: { email: string | null } | null };

// POST /api/shift-claims — a member asks to be linked to shifts under a name
// read off the schedule photo. Anyone in the department can request; only a
// team lead can approve (see [id]/approve).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: { department_id?: unknown; employee_name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const departmentId =
    typeof body.department_id === 'string' ? body.department_id : '';
  const employeeName =
    typeof body.employee_name === 'string' ? body.employee_name.trim() : '';

  if (!departmentId || !employeeName) {
    return NextResponse.json(
      { error: 'department_id and employee_name are required' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: membership } = await admin
    .from('department_members')
    .select('id')
    .eq('department_id', departmentId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: 'You are not a member of this department' },
      { status: 403 }
    );
  }

  // The partial unique index (department_id, employee_name, requested_by)
  // where status = 'pending' backs this up at the DB level too — this check
  // just returns a friendlier error than a raw constraint violation.
  const { data: existing } = await admin
    .from('shift_claims')
    .select('id')
    .eq('department_id', departmentId)
    .eq('employee_name', employeeName)
    .eq('requested_by', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'You already have a pending claim for this name' },
      { status: 409 }
    );
  }

  const { data: inserted, error: insertError } = await admin
    .from('shift_claims')
    .insert({
      department_id: departmentId,
      employee_name: employeeName,
      requested_by: user.id,
    })
    .select('id')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: claimData, error } = await admin
    .from('shift_claims')
    .select(CLAIM_SELECT)
    .eq('id', inserted.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // CLAIM_SELECT is a plain string, so supabase-js can't infer the joined
  // requester/resolver shape from it — cast to the app-level type instead.
  const claim = claimData as unknown as ShiftClaim;

  // Best-effort notification — the claim above already succeeded and is
  // returned regardless of whether this email goes out.
  try {
    const [
      { data: department, error: departmentError },
      { data: leadRows, error: leadRowsError },
    ] = await Promise.all([
      admin.from('departments').select('name').eq('id', departmentId).maybeSingle(),
      admin
        .from('department_members')
        .select('profiles(email)')
        .eq('department_id', departmentId)
        .eq('role', 'team_lead'),
    ]);

    // Supabase-js resolves API-level failures as { error }, it doesn't throw
    // — so without this, a failed lookup here would silently look identical
    // to "no team leads found" and the catch block below would never fire.
    if (departmentError) {
      console.error(
        'Failed to look up department name for shift claim notification:',
        departmentError
      );
    }
    if (leadRowsError) {
      console.error(
        'Failed to look up team lead emails for shift claim notification:',
        leadRowsError
      );
    }

    const teamLeadEmails = ((leadRows ?? []) as unknown as TeamLeadRow[])
      .map((row) => row.profiles?.email)
      .filter((email): email is string => Boolean(email));

    await sendShiftClaimNotification({
      teamLeadEmails,
      departmentName: department?.name ?? 'your department',
      employeeName,
      requesterName: claim.requester?.full_name?.trim() || 'Unnamed member',
    });
  } catch (err) {
    console.error('Failed to send shift claim notification email:', err);
  }

  return NextResponse.json({ claim }, { status: 201 });
}

// GET /api/shift-claims?department_id= — team leads see every claim in the
// department; regular members only ever see their own, enforced here rather
// than left to the client.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get('department_id');

  if (!departmentId) {
    return NextResponse.json(
      { error: 'department_id is required' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: membership } = await admin
    .from('department_members')
    .select('role')
    .eq('department_id', departmentId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: 'You are not a member of this department' },
      { status: 403 }
    );
  }

  let query = admin
    .from('shift_claims')
    .select(CLAIM_SELECT)
    .eq('department_id', departmentId)
    .order('created_at', { ascending: false });

  if (membership.role !== 'team_lead') {
    query = query.eq('requested_by', user.id);
  }

  const { data: claims, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ claims: claims ?? [] });
}
