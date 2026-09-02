import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteContext = { params: Promise<{ id: string }> };

type IncomingShift = {
  employee_name?: unknown;
  date?: unknown;
  start_time?: unknown;
  end_time?: unknown;
  user_id?: unknown;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

// POST /api/schedules/[id]/publish — turn the verified rows into real shifts.
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: {
    shifts?: unknown;
    schedule_start_date?: unknown;
    schedule_end_date?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.shifts) || body.shifts.length === 0) {
    return NextResponse.json(
      { error: 'At least one shift is required' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: upload, error: uploadError } = await admin
    .from('schedule_uploads')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  if (!upload) {
    return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from('department_members')
    .select('id')
    .eq('department_id', upload.department_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: 'You are not a member of this department' },
      { status: 403 }
    );
  }

  if (upload.status === 'published') {
    return NextResponse.json(
      { error: 'This schedule has already been published' },
      { status: 409 }
    );
  }

  // Validate every row before writing anything, so a bad row can't leave a
  // half-published schedule behind.
  const rows = [];
  for (let i = 0; i < body.shifts.length; i++) {
    const shift = body.shifts[i] as IncomingShift;
    const label = `Row ${i + 1}`;

    const employeeName =
      typeof shift.employee_name === 'string' ? shift.employee_name.trim() : '';
    if (!employeeName) {
      return NextResponse.json(
        { error: `${label}: employee name is required` },
        { status: 400 }
      );
    }

    if (typeof shift.date !== 'string' || !DATE_RE.test(shift.date)) {
      return NextResponse.json(
        { error: `${label}: date must be YYYY-MM-DD` },
        { status: 400 }
      );
    }

    if (typeof shift.start_time !== 'string' || !TIME_RE.test(shift.start_time)) {
      return NextResponse.json(
        { error: `${label}: start time must be HH:MM` },
        { status: 400 }
      );
    }

    if (typeof shift.end_time !== 'string' || !TIME_RE.test(shift.end_time)) {
      return NextResponse.json(
        { error: `${label}: end time must be HH:MM` },
        { status: 400 }
      );
    }

    rows.push({
      department_id: upload.department_id,
      schedule_upload_id: upload.id,
      user_id: typeof shift.user_id === 'string' && shift.user_id ? shift.user_id : null,
      employee_name: employeeName,
      date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      status: 'assigned',
    });
  }

  const startDate =
    typeof body.schedule_start_date === 'string' && DATE_RE.test(body.schedule_start_date)
      ? body.schedule_start_date
      : rows.reduce((min, r) => (r.date < min ? r.date : min), rows[0].date);

  const endDate =
    typeof body.schedule_end_date === 'string' && DATE_RE.test(body.schedule_end_date)
      ? body.schedule_end_date
      : rows.reduce((max, r) => (r.date > max ? r.date : max), rows[0].date);

  const { data: shifts, error: shiftsError } = await admin
    .from('shifts')
    .insert(rows)
    .select();

  if (shiftsError) {
    return NextResponse.json({ error: shiftsError.message }, { status: 500 });
  }

  const { error: statusError } = await admin
    .from('schedule_uploads')
    .update({
      status: 'published',
      schedule_start_date: startDate,
      schedule_end_date: endDate,
    })
    .eq('id', upload.id);

  if (statusError) {
    // Don't leave orphaned shifts attached to an unpublished upload.
    await admin.from('shifts').delete().eq('schedule_upload_id', upload.id);
    return NextResponse.json({ error: statusError.message }, { status: 500 });
  }

  return NextResponse.json({ shifts }, { status: 201 });
}
