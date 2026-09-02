import { NextResponse, type NextRequest } from 'next/server';
import { applySwapOutcome, loadSwapContext, returnSwap } from '@/lib/swaps';

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/swaps/[id]/claim — take a dropped shift.
export async function PATCH(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const context = await loadSwapContext(id);

  if ('error' in context) return context.error;
  const { admin, user, swap, department } = context;

  if (swap.type !== 'drop') {
    return NextResponse.json(
      { error: 'Only dropped shifts can be claimed' },
      { status: 400 }
    );
  }

  if (swap.status !== 'open') {
    return NextResponse.json(
      { error: 'This request is no longer open' },
      { status: 409 }
    );
  }

  if (swap.requester_id === user.id) {
    return NextResponse.json(
      { error: 'You cannot claim your own shift' },
      { status: 400 }
    );
  }

  if (department.require_approval) {
    const { error } = await admin
      .from('swap_requests')
      .update({ status: 'pending_approval', responder_id: user.id })
      .eq('id', swap.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return returnSwap(admin, swap.id);
  }

  const { error: updateError } = await admin
    .from('swap_requests')
    .update({
      status: 'approved',
      responder_id: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', swap.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const failure = await applySwapOutcome(admin, { ...swap, responder_id: user.id });
  if (failure) {
    return NextResponse.json({ error: failure }, { status: 500 });
  }

  return returnSwap(admin, swap.id);
}
