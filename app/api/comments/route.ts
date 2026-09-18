import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/notifications';
import type { CommentTargetType } from '@/types';

const SUPPORTED_TARGET_TYPES: CommentTargetType[] = ['shift', 'swap_request'];

function isSupportedTargetType(value: unknown): value is 'shift' | 'swap_request' {
  return value === 'shift' || value === 'swap_request';
}

type TargetInfo = {
  departmentId: string;
  // The accounts a comment on this target should notify — the shift's
  // linked member, or the swap's requester/responder — never including
  // the commenter themselves (filtered by the caller).
  notifyUserIds: string[];
};

// Looks up the department a target belongs to, plus who else has a stake in
// it, straight from the target's own table — comments don't duplicate that
// data, so every read/write here goes through the source of truth instead.
async function loadTargetInfo(
  admin: ReturnType<typeof createAdminClient>,
  targetType: 'shift' | 'swap_request',
  targetId: string
): Promise<TargetInfo | null> {
  if (targetType === 'shift') {
    const { data: shift } = await admin
      .from('shifts')
      .select('department_id, user_id')
      .eq('id', targetId)
      .maybeSingle();

    if (!shift) return null;
    return {
      departmentId: shift.department_id,
      notifyUserIds: shift.user_id ? [shift.user_id] : [],
    };
  }

  const { data: swap } = await admin
    .from('swap_requests')
    .select('department_id, requester_id, responder_id')
    .eq('id', targetId)
    .maybeSingle();

  if (!swap) return null;
  return {
    departmentId: swap.department_id,
    notifyUserIds: [swap.requester_id, swap.responder_id].filter(
      (id): id is string => Boolean(id)
    ),
  };
}

// GET /api/comments?target_type=&target_id= — the full flat thread for one
// shift or swap request, oldest first (a chronological feed, not nested
// replies — comments has no parent_id to nest with).
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get('target_type');
  const targetId = searchParams.get('target_id');

  if (!isSupportedTargetType(targetType) || !targetId) {
    return NextResponse.json(
      { error: `target_type must be one of: ${SUPPORTED_TARGET_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const target = await loadTargetInfo(admin, targetType, targetId);

  if (!target) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from('department_members')
    .select('id')
    .eq('department_id', target.departmentId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: 'You are not a member of this department' },
      { status: 403 }
    );
  }

  const { data: comments, error } = await admin
    .from('comments')
    .select('*, profiles(id, email, full_name, avatar_url, created_at)')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const normalized = (comments ?? []).map((row) => {
    const { profiles, ...comment } = row as typeof row & { profiles?: unknown };
    return { ...comment, profile: profiles ?? undefined };
  });

  return NextResponse.json({ comments: normalized });
}

// POST /api/comments — { target_type, target_id, content }. Notifies
// whoever else has a stake in the target (shift owner, or the swap's other
// party), not the commenter themselves.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: { target_type?: unknown; target_id?: unknown; content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const targetType = body.target_type;
  const targetId = typeof body.target_id === 'string' ? body.target_id : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';

  if (!isSupportedTargetType(targetType) || !targetId) {
    return NextResponse.json(
      { error: `target_type must be one of: ${SUPPORTED_TARGET_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  if (!content) {
    return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
  }

  const admin = createAdminClient();
  const target = await loadTargetInfo(admin, targetType, targetId);

  if (!target) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from('department_members')
    .select('id')
    .eq('department_id', target.departmentId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: 'You are not a member of this department' },
      { status: 403 }
    );
  }

  const { data: inserted, error: insertError } = await admin
    .from('comments')
    .insert({
      department_id: target.departmentId,
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      content,
    })
    .select('*, profiles(id, email, full_name, avatar_url, created_at)')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { profiles, ...commentRow } = inserted as typeof inserted & {
    profiles?: { full_name: string | null } | null;
  };
  const comment = { ...commentRow, profile: profiles ?? undefined };

  const commenterName = profiles?.full_name?.trim() || 'A team member';
  const preview = content.length > 140 ? `${content.slice(0, 137)}...` : content;

  const recipients = target.notifyUserIds.filter((id) => id !== user.id);
  await Promise.all(
    recipients.map((recipientId) =>
      createNotification(admin, recipientId, {
        type: 'comment',
        title: 'New comment',
        message: `${commenterName} commented: "${preview}"`,
        targetType,
        targetId,
      })
    )
  );

  return NextResponse.json({ comment }, { status: 201 });
}
