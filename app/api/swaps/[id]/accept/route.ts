import { NextResponse, type NextRequest } from 'next/server';
import {
  applySwapOutcome,
  loadSwapContext,
  ownsShift,
  returnSwap,
} from '@/lib/swaps';
import { createNotification } from '@/lib/notifications';

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/swaps/[id]/accept — agree to a proposed trade.
export async function PATCH(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const context = await loadSwapContext(id);

  if ('error' in context) return context.error;
  const { admin, user, profile, swap, department } = context;

  if (swap.type !== 'trade') {
    return NextResponse.json(
      { error: 'Only trades can be accepted' },
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
      { error: 'You cannot accept your own trade' },
      { status: 400 }
    );
  }

  // The trade is addressed to whoever holds the shift that was asked for.
  const { data: offeredShift } = await admin
    .from('shifts')
    .select('*')
    .eq('id', swap.offered_shift_id)
    .maybeSingle();

  if (!offeredShift) {
    return NextResponse.json(
      { error: 'The shift in this trade no longer exists' },
      { status: 404 }
    );
  }

  if (!ownsShift(offeredShift, user.id, profile?.full_name)) {
    return NextResponse.json(
      { error: 'This trade was proposed for a shift that is not yours' },
      { status: 403 }
    );
  }

  // Fires regardless of whether a team lead still needs to sign off — the
  // requester should know someone stepped up either way.
  await createNotification(admin, swap.requester_id, {
    type: 'swap_claimed',
    title: 'Your trade was accepted',
    message: `${profile?.full_name?.trim() || 'A team member'} accepted your trade proposal.`,
    targetType: 'swap_request',
    targetId: swap.id,
  });

  if (department.require_approval) {
    const { error } = await admin
      .from('swap_requests')
      .update({ status: 'pending_approval', responder_id: user.id })
      .eq('id', swap.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await admin
      .from('shifts')
      .update({ status: 'swap_pending' })
      .eq('id', offeredShift.id);

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
