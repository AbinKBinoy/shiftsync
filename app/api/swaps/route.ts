import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SWAP_SELECT, ownsShift } from '@/lib/swaps';

// POST /api/swaps — put one of your shifts up for a drop or a trade.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: {
    original_shift_id?: unknown;
    type?: unknown;
    offered_shift_id?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const originalShiftId =
    typeof body.original_shift_id === 'string' ? body.original_shift_id : '';
  const type = body.type === 'drop' || body.type === 'trade' ? body.type : null;
  const offeredShiftId =
    typeof body.offered_shift_id === 'string' && body.offered_shift_id
      ? body.offered_shift_id
      : null;

  if (!originalShiftId) {
    return NextResponse.json(
      { error: 'original_shift_id is required' },
      { status: 400 }
    );
  }

  if (!type) {
    return NextResponse.json(
      { error: "type must be 'drop' or 'trade'" },
      { status: 400 }
    );
  }

  if (type === 'trade' && !offeredShiftId) {
    return NextResponse.json(
      { error: 'A trade needs the shift you want in return' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: originalShift } = await admin
    .from('shifts')
    .select('*')
    .eq('id', originalShiftId)
    .maybeSingle();

  if (!originalShift) {
    return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
  }

  const { data: membership } = await admin
    .from('department_members')
    .select('role')
    .eq('department_id', originalShift.department_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: 'You are not a member of this department' },
      { status: 403 }
    );
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!ownsShift(originalShift, user.id, profile?.full_name)) {
    return NextResponse.json(
      { error: 'You can only swap your own shifts' },
      { status: 403 }
    );
  }

  if (originalShift.status !== 'assigned') {
    return NextResponse.json(
      { error: 'This shift already has an open swap request' },
      { status: 409 }
    );
  }

  let offeredShift = null;
  if (type === 'trade' && offeredShiftId) {
    const { data } = await admin
      .from('shifts')
      .select('*')
      .eq('id', offeredShiftId)
      .maybeSingle();

    if (!data) {
      return NextResponse.json(
        { error: 'The shift you asked for was not found' },
        { status: 404 }
      );
    }

    if (data.department_id !== originalShift.department_id) {
      return NextResponse.json(
        { error: 'Both shifts must be in the same department' },
        { status: 400 }
      );
    }

    if (ownsShift(data, user.id, profile?.full_name)) {
      return NextResponse.json(
        { error: 'Pick a shift belonging to another member to trade for' },
        { status: 400 }
      );
    }

    offeredShift = data;
  }

  const { data: swap, error: insertError } = await admin
    .from('swap_requests')
    .insert({
      department_id: originalShift.department_id,
      requester_id: user.id,
      original_shift_id: originalShift.id,
      type,
      offered_shift_id: offeredShift?.id ?? null,
      status: 'open',
    })
    .select('id')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // A dropped shift becomes claimable, so it reads as 'open'. A trade is
  // waiting on one specific person, so it reads as 'swap_pending'.
  const { error: shiftError } = await admin
    .from('shifts')
    .update({ status: type === 'drop' ? 'open' : 'swap_pending' })
    .eq('id', originalShift.id);

  if (shiftError) {
    await admin.from('swap_requests').delete().eq('id', swap.id);
    return NextResponse.json({ error: shiftError.message }, { status: 500 });
  }

  const { data: created } = await admin
    .from('swap_requests')
    .select(SWAP_SELECT)
    .eq('id', swap.id)
    .single();

  return NextResponse.json({ swap: created }, { status: 201 });
}

// GET /api/swaps?department_id= — every swap request for a department.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get('department_id');

  if (!departmentId) {
    return NextResponse.json(
      { error: 'department_id is required' },
      { status: 400 }
    );
  }

  const { data: membership } = await supabase
    .from('department_members')
    .select('id')
    .eq('department_id', departmentId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: 'You are not a member of this department' },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  const { data: swaps, error } = await admin
    .from('swap_requests')
    .select(SWAP_SELECT)
    .eq('department_id', departmentId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ swaps: swaps ?? [] });
}
