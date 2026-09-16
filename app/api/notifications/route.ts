import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/notifications?unread_only=true — the current user's notifications,
// most recent first, plus their unread count.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread_only') === 'true';

  const admin = createAdminClient();

  let query = admin
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data: notifications, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count: unreadCount, error: countError } = await admin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  return NextResponse.json({
    notifications: notifications ?? [],
    unread_count: unreadCount ?? 0,
  });
}
