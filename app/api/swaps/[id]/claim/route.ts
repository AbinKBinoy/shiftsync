import { NextResponse, type NextRequest } from 'next/server';
import { applySwapOutcome, loadSwapContext, returnSwap } from '@/lib/swaps';
import { createNotification } from '@/lib/notifications';

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/swaps/[id]/claim — take a dropped shift.
export async function PATCH(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const context = await loadSwapContext(id);

  if ('error' in context) return context.error;
  const { admin, user, profile, swap, department } = context;

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

  // Fires regardless of whether a team lead still needs to sign off — the
  // requester should know someone stepped up either way.
  await createNotification(admin, swap.requester_id, {
    type: 'swap_claimed',
    title: 'Your dropped shift was claimed',
    message: `${profile?.full_name?.trim() || 'A team member'} claimed your open shift.`,
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
