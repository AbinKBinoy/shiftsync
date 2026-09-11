import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateCalendarFeed } from '@/lib/ics';
import { addDays, toISODate } from '@/lib/dates';

type RouteContext = { params: Promise<{ token: string }> };

// Calendar apps re-fetch on their own schedule, so never cache the module.
export const dynamic = 'force-dynamic';

const MONTHS_BACK = 3;
const MONTHS_FORWARD = 6;

// GET /api/calendar/[token]/feed.ics
//
// Deliberately unauthenticated: calendar clients can't complete an OAuth flow.
// The token is the credential, so it must stay unguessable and must never be
// exposed to anyone but its owner. This route is excluded from the auth
// middleware in middleware.ts.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { token } = await params;

  if (!token || token.length < 16) {
    return new NextResponse('Not found', { status: 404 });
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .eq('calendar_token', token)
    .maybeSingle();

  if (!profile) {
    return new NextResponse('Not found', { status: 404 });
  }

  const today = new Date();
  const start = toISODate(addDays(today, -MONTHS_BACK * 30));
  const end = toISODate(addDays(today, MONTHS_FORWARD * 30));

  const { data: shifts, error } = await admin
    .from('shifts')
    .select('*, departments(name)')
    .eq('user_id', profile.id)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true });

  if (error) {
    return new NextResponse('Unable to build calendar', { status: 500 });
  }

  const feedShifts = (shifts ?? []).map((row) => {
    const { departments, ...shift } = row as typeof row & {
      departments?: { name?: string } | null;
    };
    return { ...shift, department_name: departments?.name ?? 'ShiftSync' };
  });

  const body = generateCalendarFeed(feedShifts, 'ShiftSync');

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="shiftsync.ics"',
      // Calendar clients poll on a timer; 15 minutes keeps load sane.
      'Cache-Control': 'public, max-age=900',
    },
  });
}
