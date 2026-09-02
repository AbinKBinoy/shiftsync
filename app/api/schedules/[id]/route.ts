import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createAdminClient,
  SCHEDULES_BUCKET,
  SIGNED_URL_TTL_SECONDS,
} from '@/lib/supabase/admin';

type RouteContext = { params: Promise<{ id: string }> };

// Resolves the upload and confirms the caller belongs to its department.
async function loadUploadForMember(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data: upload, error } = await admin
    .from('schedule_uploads')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  }

  if (!upload) {
    return { error: NextResponse.json({ error: 'Upload not found' }, { status: 404 }) };
  }

  const { data: membership } = await supabase
    .from('department_members')
    .select('id')
    .eq('department_id', upload.department_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return {
      error: NextResponse.json(
        { error: 'You are not a member of this department' },
        { status: 403 }
      ),
    };
  }

  return { upload, admin, user };
}

// GET /api/schedules/[id] — fetch one upload, with a fresh signed image URL.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const result = await loadUploadForMember(id);

  if (result.error) return result.error;
  const { upload, admin } = result;

  const { data: signed } = await admin.storage
    .from(SCHEDULES_BUCKET)
    .createSignedUrl(upload.image_url, SIGNED_URL_TTL_SECONDS);

  return NextResponse.json({
    upload,
    image_signed_url: signed?.signedUrl ?? null,
  });
}

// PATCH /api/schedules/[id] — save edits made to the extracted table.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const result = await loadUploadForMember(id);

  if (result.error) return result.error;
  const { upload, admin } = result;

  let body: { extracted_data?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.extracted_data === undefined) {
    return NextResponse.json(
      { error: 'extracted_data is required' },
      { status: 400 }
    );
  }

  if (upload.status === 'published') {
    return NextResponse.json(
      { error: 'This schedule has already been published' },
      { status: 409 }
    );
  }

  const { data: updated, error } = await admin
    .from('schedule_uploads')
    .update({ extracted_data: body.extracted_data })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ upload: updated });
}
