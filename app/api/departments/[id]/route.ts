import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/departments/[id] — team lead updates department settings.
// Only require_approval is editable here; renaming/deleting isn't in scope.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: { require_approval?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.require_approval !== 'boolean') {
    return NextResponse.json(
      { error: 'require_approval must be a boolean' },
      { status: 400 }
    );
  }

  const { data: membership } = await supabase
    .from('department_members')
    .select('role')
    .eq('department_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: 'You are not a member of this department' },
      { status: 403 }
    );
  }

  // Settings are a team lead's call, same boundary as /api/shifts/link.
  if (membership.role !== 'team_lead') {
    return NextResponse.json(
      { error: 'Only a team lead can change department settings' },
      { status: 403 }
    );
  }

  // The membership check above already proved the caller is this
  // department's team lead — the update itself runs on the admin client so
  // it isn't blocked by whatever RLS policy (or absence of one) exists on
  // departments for direct client writes.
  const admin = createAdminClient();
  const { data: department, error } = await admin
    .from('departments')
    .update({ require_approval: body.require_approval })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ department });
}
