import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationTargetType, NotificationType } from '@/types';

type NotificationInput = {
  type: NotificationType;
  title: string;
  message: string;
  targetType: NotificationTargetType;
  targetId: string;
};

// Best-effort by design, same philosophy as lib/email.ts: whatever action
// triggered a notification has already succeeded by the time this runs, so a
// failed insert here is logged and swallowed rather than surfaced to the
// caller. Callers should not need to wrap these in their own try/catch.
export async function createNotification(
  admin: SupabaseClient,
  userId: string,
  input: NotificationInput
): Promise<void> {
  const { error } = await admin.from('notifications').insert({
    user_id: userId,
    type: input.type,
    title: input.title,
    message: input.message,
    target_type: input.targetType,
    target_id: input.targetId,
  });

  if (error) {
    console.error('Failed to create notification:', error);
  }
}

// Notifies every team lead in a department at once. `excludeUserId` skips
// the acting user so a team lead doesn't get notified about their own action.
export async function notifyTeamLeads(
  admin: SupabaseClient,
  departmentId: string,
  input: NotificationInput,
  excludeUserId?: string
): Promise<void> {
  const { data: leadRows, error } = await admin
    .from('department_members')
    .select('user_id')
    .eq('department_id', departmentId)
    .eq('role', 'team_lead');

  if (error) {
    console.error('Failed to look up team leads for notification:', error);
    return;
  }

  const leadIds = ((leadRows ?? []) as Array<{ user_id: string }>)
    .map((row) => row.user_id)
    .filter((id) => id !== excludeUserId);

  if (leadIds.length === 0) return;

  const { error: insertError } = await admin.from('notifications').insert(
    leadIds.map((userId) => ({
      user_id: userId,
      type: input.type,
      title: input.title,
      message: input.message,
      target_type: input.targetType,
      target_id: input.targetId,
    }))
  );

  if (insertError) {
    console.error('Failed to create team lead notifications:', insertError);
  }
}
