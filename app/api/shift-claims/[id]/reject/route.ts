import { NextResponse, type NextRequest } from 'next/server';
import { loadClaimContext, returnClaim } from '@/lib/shiftClaims';

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/shift-claims/[id]/reject — team lead turns down a self-claim.
// No shifts are touched.
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

  const { error } = await admin
    .from('shift_claims')
    .update({
      status: 'rejected',
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', claim.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return returnClaim(admin, claim.id);
}
