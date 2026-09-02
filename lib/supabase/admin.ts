import { createClient } from '@supabase/supabase-js';

// Service-role client — bypasses RLS. Only ever use this from server-side API
// routes that have already authenticated the user and constrained the write
// themselves. Never import this into a client component.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export const SCHEDULES_BUCKET = 'schedules';

// Matches the limits configured on the Supabase Storage bucket itself.
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// The bucket is private, so images are served through short-lived signed URLs
// rather than a public URL.
export const SIGNED_URL_TTL_SECONDS = 60 * 60;
