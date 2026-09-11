import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/user/calendar-token — the caller's own feed token, minted on first
// request. Only ever returns the token of the authenticated user.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, calendar_token')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.calendar_token) {
    return NextResponse.json({ calendar_token: profile.calendar_token });
  }

  // The column has a default, but older rows (or a partial migration) can still
  // be null — mint one on demand rather than failing.
  const token = randomUUID();
  const { data: updated, error: updateError } = await admin
    .from('profiles')
    .update({ calendar_token: token })
    .eq('id', user.id)
    .select('calendar_token')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ calendar_token: updated.calendar_token });
}
