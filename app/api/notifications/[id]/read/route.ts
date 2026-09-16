import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/notifications/[id]/read — mark a single notification as read.
// Only its owner can do this.
export async function PATCH(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: notification } = await admin
    .from('notifications')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle();

  if (!notification) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  if (notification.user_id !== user.id) {
    return NextResponse.json(
      { error: 'You can only mark your own notifications as read' },
      { status: 403 }
    );
  }

  const { error } = await admin
    .from('notifications')
    .update({ read: true })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
