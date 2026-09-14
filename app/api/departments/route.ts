import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Excludes easily confused characters (0/O, 1/I/L) so codes are easy to read and type.
// this section generates a 6 digit code 
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/departments — create a department, with the creator as team_lead.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: { name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json(
      { error: 'Department name is required' },
      { status: 400 }
    );
  }

  // Retry on the (unlikely) chance of an invite code collision.
  let department = null;
  let lastError = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('departments')
      .insert({
        name,
        invite_code: generateInviteCode(),
        created_by: user.id,
      })
      .select()
      .single();

    if (!error) {
      department = data;
      break;
    }

    lastError = error;
    // 23505 = unique violation. Anything else is a real failure.
    if (error.code !== '23505') break;
  }

  if (!department) {
    return NextResponse.json(
      { error: lastError?.message ?? 'Could not create department' },
      { status: 500 }
    );
  }

  const { error: memberError } = await supabase
    .from('department_members')
    .insert({
      department_id: department.id,
      user_id: user.id,
      role: 'team_lead',
    });

  if (memberError) {
    // Don't leave an orphaned department behind.
    await supabase.from('departments').delete().eq('id', department.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ department }, { status: 201 });
}

// GET /api/departments — list the departments the current user belongs to
// When it receives a GET request (listing departments), 
// it queries department_members for the current user 
// and joins with the departments table to get the department details back..
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('department_members')
    .select(
      'role, joined_at, departments(id, name, invite_code, created_by, require_approval, created_at, department_members(count))'
    )
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const departments = (data ?? [])
    .filter((row) => row.departments)
    .map((row) => {
      const dept = row.departments as unknown as Record<string, unknown> & {
        department_members?: { count: number }[];
      };
      const { department_members, ...rest } = dept;

      return {
        ...rest,
        role: row.role,
        joined_at: row.joined_at,
        member_count: department_members?.[0]?.count ?? 0,
      };
    });

  return NextResponse.json({ departments });
}
