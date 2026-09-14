import { NextResponse, type NextRequest } from 'next/server';
import { applyClaimApproval, loadClaimContext, returnClaim } from '@/lib/shiftClaims';

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

  return returnClaim(admin, claim.id);
}
