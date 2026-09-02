import type { ExtractionResult } from '@/types';

const EXTRACTION_URL = process.env.EXTRACTION_SERVICE_URL;

// FastAPI returns `detail` as a string for handled errors, but as an array of
// validation objects for a 422. Flatten both into one readable message.
function messageFromDetail(detail: unknown): string | null {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const parts = detail
      .map((d) => (d && typeof d === 'object' && 'msg' in d ? String(d.msg) : null))
      .filter(Boolean);
    if (parts.length > 0) return parts.join('; ');
  }
  return null;
}

// `contentType` is required: a Blob built without one is sent as
// application/octet-stream, which the extraction service rejects outright.
export async function extractSchedule(
  imageBuffer: Buffer,
  filename: string,
  contentType: string
): Promise<ExtractionResult> {
  const formData = new FormData();
  formData.append(
    'file',
    new Blob([new Uint8Array(imageBuffer)], { type: contentType }),
    filename
  );

  const response = await fetch(`${EXTRACTION_URL}/extract-schedule`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: 'Extraction failed' }));
    throw new Error(messageFromDetail(error.detail) ?? 'Extraction failed');
  }

  return response.json();
}
