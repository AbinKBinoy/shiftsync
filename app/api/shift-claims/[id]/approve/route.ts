import { NextResponse, type NextRequest } from 'next/server';
import {
  applyClaimApproval,
  findLinkedNameConflict,
  loadClaimContext,
  returnClaim,
} from '@/lib/shiftClaims';
import { createNotification } from '@/lib/notifications';

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/shift-claims/[id]/approve — team lead confirms a self-claim and
// links every matching unlinked shift to the requester in one action.
export async function PATCH(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const context = await loadClaimContext(id);

  if ('error' in context) return context.error;
  const { admin, user, claim } = context;

  if (claim.status !== 'pending') {
    return NextResponse.json(
      { error: 'This claim has already been resolved' },
      { status: 409 }
    );
  }

  // Second line of defense: the requester may have been linked to a
  // different name through another path (the manual NameLinker tool, or a
  // second claim approved first) since this claim was filed.
  const conflictName = await findLinkedNameConflict(
    admin,
    claim.department_id,
    claim.requested_by,
    claim.employee_name
  );

  if (conflictName) {
    return NextResponse.json(
      {
        error: `This member is already linked to ${conflictName} in this department — approving this claim would link them to a second name.`,
      },
      { status: 409 }
    );
  }

  const { error: updateError } = await admin
    .from('shift_claims')
    .update({
      status: 'approved',
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', claim.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const failure = await applyClaimApproval(admin, claim);
  if (failure) {
    return NextResponse.json({ error: failure }, { status: 500 });
  }

  await createNotification(admin, claim.requested_by, {
    type: 'shift_claim_approved',
    title: 'Your shift claim was approved',
    message: `You're now linked to ${claim.employee_name}'s shifts.`,
    targetType: 'shift_claim',
    targetId: claim.id,
  });

  return returnClaim(admin, claim.id);
}
