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

// Browsers report `file.type` from the OS, which is empty or wrong often enough
// (WhatsApp downloads especially) that it can't be trusted. Read the real type
// off the file's magic bytes instead. Returns null if it isn't an image we take.
export function sniffImageType(buffer: Buffer): string | null {
  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (
    buffer.length >= PNG_SIGNATURE.length &&
    PNG_SIGNATURE.every((byte, i) => buffer[i] === byte)
  ) {
    return 'image/png';
  }

  // WebP: "RIFF" at 0, then "WEBP" at 8 (bytes 4-7 are the chunk size).
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}
