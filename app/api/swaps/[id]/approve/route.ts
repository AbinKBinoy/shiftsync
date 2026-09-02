import { NextResponse, type NextRequest } from 'next/server';
import { applySwapOutcome, loadSwapContext, returnSwap } from '@/lib/swaps';

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/swaps/[id]/approve — team lead signs off on a pending swap.
export async function PATCH(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const context = await loadSwapContext(id);

  if ('error' in context) return context.error;
  const { admin, user, swap, role } = context;

  if (role !== 'team_lead') {
    return NextResponse.json(
      { error: 'Only a team lead can approve swaps' },
      { status: 403 }
    );
  }

  if (swap.status !== 'pending_approval') {
    return NextResponse.json(
      { error: 'This request is not waiting for approval' },
      { status: 409 }
    );
  }

  if (!swap.responder_id) {
    return NextResponse.json(
      { error: 'This request has nobody to hand the shift to' },
      { status: 409 }
    );
  }

  const { error: updateError } = await admin
    .from('swap_requests')
    .update({
      status: 'approved',
      approved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', swap.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const failure = await applySwapOutcome(admin, swap);
  if (failure) {
    return NextResponse.json({ error: failure }, { status: 500 });
  }

  return returnSwap(admin, swap.id);
}
