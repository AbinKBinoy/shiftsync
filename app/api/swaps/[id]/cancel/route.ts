import { NextResponse, type NextRequest } from 'next/server';
import { loadSwapContext, releaseShift, returnSwap } from '@/lib/swaps';

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/swaps/[id]/cancel — the requester withdraws their own request.
export async function PATCH(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const context = await loadSwapContext(id);

  if ('error' in context) return context.error;
  const { admin, user, swap } = context;

  if (swap.requester_id !== user.id) {
    return NextResponse.json(
      { error: 'Only the person who made the request can cancel it' },
      { status: 403 }
    );
  }

  if (swap.status === 'approved' || swap.status === 'rejected' || swap.status === 'cancelled') {
    return NextResponse.json(
      { error: 'This request has already been resolved' },
      { status: 409 }
    );
  }

  const { error } = await admin
    .from('swap_requests')
    .update({ status: 'cancelled', resolved_at: new Date().toISOString() })
    .eq('id', swap.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await releaseShift(admin, swap.original_shift_id);
  if (swap.offered_shift_id) {
    await releaseShift(admin, swap.offered_shift_id);
  }

  return returnSwap(admin, swap.id);
}
