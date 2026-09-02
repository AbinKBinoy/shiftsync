import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createAdminClient,
  sniffImageType,
  SCHEDULES_BUCKET,
  MAX_IMAGE_BYTES,
  SIGNED_URL_TTL_SECONDS,
} from '@/lib/supabase/admin';
import { extractSchedule } from '@/lib/extraction';

// Keep the stored object name predictable and safe for a URL path.
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80) || 'schedule.jpg';
}

// POST /api/schedules/upload — store the photo, then run it through the
// Python extraction service.
export async function POST(request: NextRequest) {
  try {
    return await handleUpload(request);
  } catch (err) {
    console.error('[POST /api/schedules/upload] Unhandled error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

async function handleUpload(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart/form-data' },
      { status: 400 }
    );
  }

  const file = formData.get('file');
  const departmentId = formData.get('department_id');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
  }

  if (typeof departmentId !== 'string' || !departmentId) {
    return NextResponse.json(
      { error: 'department_id is required' },
      { status: 400 }
    );
  }

  // Checked before buffering so an oversized file is never read into memory.
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: 'Image is larger than the 10MB limit.' },
      { status: 400 }
    );
  }

  // Membership check runs as the user, so RLS is still the source of truth.
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

  const buffer = Buffer.from(await file.arrayBuffer());

  // Trust the file's contents, not the browser's MIME guess.
  const contentType = sniffImageType(buffer);

  if (!contentType) {
    return NextResponse.json(
      { error: 'Unsupported image type. Use JPEG, PNG, or WebP.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const path = `${departmentId}/${Date.now()}_${sanitizeFilename(file.name)}`;

  const { error: storageError } = await admin.storage
    .from(SCHEDULES_BUCKET)
    .upload(path, buffer, { contentType, upsert: false });

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  // The bucket is private, so `image_url` holds the object path and callers get
  // a short-lived signed URL to actually render it.
  const { data: upload, error: insertError } = await admin
    .from('schedule_uploads')
    .insert({
      department_id: departmentId,
      uploaded_by: user.id,
      image_url: path,
      status: 'processing',
    })
    .select()
    .single();

  if (insertError) {
    await admin.storage.from(SCHEDULES_BUCKET).remove([path]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  let extracted;
  try {
    extracted = await extractSchedule(buffer, file.name, contentType);
  } catch (err) {
    console.error('[POST /api/schedules/upload] Extraction failed:', err);
    // Leave the row in 'processing' so the upload isn't lost and can be retried.
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Extraction failed',
        upload_id: upload.id,
      },
      { status: 502 }
    );
  }

  const { data: updated, error: updateError } = await admin
    .from('schedule_uploads')
    .update({ extracted_data: extracted, status: 'review' })
    .eq('id', upload.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { data: signed } = await admin.storage
    .from(SCHEDULES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  return NextResponse.json(
    { upload: updated, image_signed_url: signed?.signedUrl ?? null },
    { status: 201 }
  );
}
