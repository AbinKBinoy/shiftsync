import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/shifts?department_id=&start_date=&end_date=&user_id=
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
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const userId = searchParams.get('user_id');

  if (!departmentId) {
    return NextResponse.json(
      { error: 'department_id is required' },
      { status: 400 }
    );
  }

  const { data: membership } = await supabase
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

  let query = supabase
    .from('shifts')
    .select('*, profiles(id, email, full_name, avatar_url, created_at)')
    .eq('department_id', departmentId);

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  if (userId) query = query.eq('user_id', userId);

  const { data: shifts, error } = await query
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // One extra query for every comment row on this page of shifts, tallied
  // here, rather than one comments query per shift (N+1). Comments has no
  // count-by-target aggregate via the client, so the grouping happens in JS
  // over a single flat list of target_ids.
  const shiftIds = (shifts ?? []).map((s) => s.id);
  const commentCounts = new Map<string, number>();

  if (shiftIds.length > 0) {
    const admin = createAdminClient();
    const { data: commentRows } = await admin
      .from('comments')
      .select('target_id')
      .eq('target_type', 'shift')
      .in('target_id', shiftIds);

    for (const row of commentRows ?? []) {
      commentCounts.set(row.target_id, (commentCounts.get(row.target_id) ?? 0) + 1);
    }
  }

  // Supabase embeds the join under the table name; the Shift type calls it
  // `profile`.
  const normalized = (shifts ?? []).map((row) => {
    const { profiles, ...shift } = row as typeof row & { profiles?: unknown };
    return {
      ...shift,
      profile: profiles ?? undefined,
      comment_count: commentCounts.get(shift.id) ?? 0,
    };
  });

  return NextResponse.json({ shifts: normalized });
}
