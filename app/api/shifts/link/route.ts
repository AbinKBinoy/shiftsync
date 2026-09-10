import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type IncomingLink = { employee_name?: unknown; user_id?: unknown };

// POST /api/shifts/link — attach an account to every unlinked shift carrying
// that employee name. Bulk by design: one entry covers all of someone's shifts.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: { department_id?: unknown; links?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const departmentId =
    typeof body.department_id === 'string' ? body.department_id : '';

  if (!departmentId) {
    return NextResponse.json(
      { error: 'department_id is required' },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.links) || body.links.length === 0) {
    return NextResponse.json({ error: 'links is required' }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from('department_members')
    .select('id, role')
    .eq('department_id', departmentId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: 'You are not a member of this department' },
      { status: 403 }
    );
  }

  // Linking decides who owns a shift, so it stays with the team lead.
  if (membership.role !== 'team_lead') {
    return NextResponse.json(
      { error: 'Only team leads can link names to accounts' },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  // Only ever link to people who actually belong to this department.
  const { data: members } = await admin
    .from('department_members')
    .select('user_id')
    .eq('department_id', departmentId);

  const memberIds = new Set((members ?? []).map((m) => m.user_id));

  const links: { employee_name: string; user_id: string }[] = [];
  for (const raw of body.links as IncomingLink[]) {
    const employeeName =
      typeof raw.employee_name === 'string' ? raw.employee_name.trim() : '';
    const userId = typeof raw.user_id === 'string' ? raw.user_id.trim() : '';

    if (!employeeName || !userId) continue;

    if (!memberIds.has(userId)) {
      return NextResponse.json(
        { error: `${employeeName} was matched to someone outside this department` },
        { status: 400 }
      );
    }

    links.push({ employee_name: employeeName, user_id: userId });
  }

  if (links.length === 0) {
    return NextResponse.json(
      { error: 'No names were matched to a member' },
      { status: 400 }
    );
  }

  let updated = 0;
  const details: { employee_name: string; updated: number }[] = [];

  for (const link of links) {
    const { data, error } = await admin
      .from('shifts')
      .update({ user_id: link.user_id })
      .eq('department_id', departmentId)
      .eq('employee_name', link.employee_name)
      .is('user_id', null)
      .select('id');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const count = data?.length ?? 0;
    updated += count;
    details.push({ employee_name: link.employee_name, updated: count });
  }

  return NextResponse.json({ updated, details });
}
