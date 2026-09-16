import { NextResponse, type NextRequest } from 'next/server';
import { loadSwapContext, releaseShift, returnSwap } from '@/lib/swaps';
import { createNotification } from '@/lib/notifications';

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/swaps/[id]/reject — team lead turns down a pending swap.
export async function PATCH(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const context = await loadSwapContext(id);

  if ('error' in context) return context.error;
  const { admin, swap, role } = context;

  if (role !== 'team_lead') {
    return NextResponse.json(
      { error: 'Only a team lead can reject swaps' },
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
    .update({ status: 'rejected', resolved_at: new Date().toISOString() })
    .eq('id', swap.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await releaseShift(admin, swap.original_shift_id);
  if (swap.offered_shift_id) {
    await releaseShift(admin, swap.offered_shift_id);
  }

  await createNotification(admin, swap.requester_id, {
    type: 'swap_rejected',
    title: 'Your swap was rejected',
    message: `Your ${swap.type} request was turned down by your team lead.`,
    targetType: 'swap_request',
    targetId: swap.id,
  });

  return returnSwap(admin, swap.id);
}
