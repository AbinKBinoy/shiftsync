import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// POST /api/departments/join — join a department using its invite code.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: { invite_code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const inviteCode =
    typeof body.invite_code === 'string'
      ? body.invite_code.trim().toUpperCase()
      : '';

  if (!inviteCode) {
    return NextResponse.json(
      { error: 'Invite code is required' },
      { status: 400 }
    );
  }

  // Looking up a department you are not yet a member of has to bypass RLS —
  // member-scoped read policies would hide the very row we need to find.
  // Safe here because the route authenticates the user first and only ever
  // writes a membership for that authenticated user.
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: department, error: lookupError } = await admin
    .from('departments')
    .select('id, name, invite_code, created_by, require_approval, created_at')
    .eq('invite_code', inviteCode)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!department) {
    return NextResponse.json(
      { error: 'No department found with that invite code' },
      { status: 404 }
    );
  }

  const { data: existing, error: existingError } = await admin
    .from('department_members')
    .select('id')
    .eq('department_id', department.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({
      department,
      message: `You are already a member of ${department.name}.`,
      already_member: true,
    });
  }

  const { error: joinError } = await admin.from('department_members').insert({
    department_id: department.id,
    user_id: user.id,
    role: 'member',
  });

  if (joinError) {
    return NextResponse.json({ error: joinError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      department,
      message: `You joined ${department.name}.`,
      already_member: false,
    },
    { status: 201 }
  );
}
