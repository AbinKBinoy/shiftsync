'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ExtractionResult, ScheduleUpload } from '@/types';

type EditableShift = {
  key: string;
  employee_name: string;
  date: string;
  start_time: string;
  end_time: string;
  confidence?: 'high' | 'low';
};

type DepartmentOption = { id: string; name: string };

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_BYTES = 10 * 1024 * 1024;

// Browsers derive `file.type` from the OS, which can report an empty or generic
// type for otherwise valid images (WhatsApp downloads are a common case). Try
// the MIME type first, then fall back to the file extension.
function isAllowedImage(file: File): boolean {
  if (ALLOWED_TYPES.includes(file.type)) return true;

  const name = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

const cellClass =
  'w-full rounded border border-transparent bg-transparent px-2 py-1 text-sm text-zinc-100 outline-none hover:border-zinc-700 focus:border-blue-500 focus:bg-zinc-950';

const primaryButtonClass =
  'rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50';

let rowCounter = 0;
function nextKey() {
  rowCounter += 1;
  return `row-${rowCounter}`;
}

// Trim a "09:00:00" from the API down to the "09:00" the time input expects.
function toTimeInput(value: string): string {
  const match = /^(\d{2}:\d{2})/.exec(value ?? '');
  return match ? match[1] : '';
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [upload, setUpload] = useState<ScheduleUpload | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [shifts, setShifts] = useState<EditableShift[]>([]);

  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDepartments() {
      try {
        const res = await fetch('/api/departments');
        if (!res.ok) throw new Error('Could not load your departments');
        const data = await res.json();
        if (!active) return;

        const list: DepartmentOption[] = (data.departments ?? []).map(
          (d: { id: string; name: string }) => ({ id: d.id, name: d.name })
        );
        setDepartments(list);
        if (list.length > 0) setDepartmentId(list[0].id);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (active) setLoadingDepartments(false);
      }
    }

    loadDepartments();
    return () => {
      active = false;
    };
  }, []);

  // Release the object URL created for the local preview.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function selectFile(next: File | null) {
    setError(null);
    if (!next) return;

    if (!isAllowedImage(next)) {
      setError('Unsupported image type. Use JPEG, PNG, or WebP.');
      return;
    }
    if (next.size > MAX_BYTES) {
      setError('Image is larger than the 10MB limit.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    selectFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function handleExtract() {
    if (!file || !departmentId) return;

    setExtracting(true);
    setError(null);

    const body = new FormData();
    body.append('file', file);
    body.append('department_id', departmentId);

    try {
      const res = await fetch('/api/schedules/upload', { method: 'POST', body });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Upload failed');
        return;
      }

      const record: ScheduleUpload = data.upload;
      const extracted = record.extracted_data as ExtractionResult | null;

      setUpload(record);
      setImageUrl(data.image_signed_url ?? previewUrl);
      setWarnings(extracted?.warnings ?? []);
      setShifts(
        (extracted?.shifts ?? []).map((s) => ({
          key: nextKey(),
          employee_name: s.employee_name ?? '',
          date: s.date ?? '',
          start_time: toTimeInput(s.start_time),
          end_time: toTimeInput(s.end_time),
          confidence: s.confidence,
        }))
      );
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setExtracting(false);
    }
  }

  function updateShift(key: string, field: keyof EditableShift, value: string) {
    setShifts((prev) =>
      prev.map((s) => (s.key === key ? { ...s, [field]: value } : s))
    );
  }

  function addRow() {
    setShifts((prev) => [
      ...prev,
      {
        key: nextKey(),
        employee_name: '',
        date: prev[prev.length - 1]?.date ?? '',
        start_time: '',
        end_time: '',
      },
    ]);
  }

  function deleteRow(key: string) {
    setShifts((prev) => prev.filter((s) => s.key !== key));
  }

  async function handlePublish() {
    if (!upload) return;

    setPublishing(true);
    setError(null);

    try {
      const res = await fetch(`/api/schedules/${upload.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shifts: shifts.map(({ employee_name, date, start_time, end_time }) => ({
            employee_name,
            date,
            start_time,
            end_time,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Publish failed');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
              Upload a schedule
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Snap a photo of the posted schedule and we&apos;ll pull the shifts out.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-50"
          >
            Back to dashboard
          </Link>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        {!upload ? (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            {departments.length > 1 && (
              <div className="mb-4">
                <label
                  htmlFor="department"
                  className="block text-sm font-medium text-zinc-300"
                >
                  Department
                </label>
                <select
                  id="department"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="mt-1 w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-blue-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
                dragging
                  ? 'border-blue-500 bg-blue-950/20'
                  : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Schedule preview"
                  className="max-h-64 rounded-lg object-contain"
                />
              ) : (
                <>
                  <p className="text-sm font-medium text-zinc-200">
                    Drop a schedule photo here, or click to browse
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    JPEG, PNG, or WebP · up to 10MB
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {file && (
              <p className="mt-3 truncate text-xs text-zinc-500">
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)}MB
              </p>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={handleExtract}
                disabled={!file || !departmentId || extracting || loadingDepartments}
                className={primaryButtonClass}
              >
                {extracting ? 'Extracting shifts…' : 'Upload & Extract'}
              </button>
              {!loadingDepartments && departments.length === 0 && (
                <span className="text-sm text-zinc-500">
                  Join a department first.
                </span>
              )}
            </div>
          </section>
        ) : (
          <>
            {warnings.length > 0 && (
              <div className="rounded-lg border border-amber-900 bg-amber-950 px-4 py-3">
                <p className="text-sm font-medium text-amber-300">
                  Check these before publishing
                </p>
                <ul className="mt-1 list-inside list-disc text-sm text-amber-200/90">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Original photo */}
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
                <h2 className="mb-3 text-sm font-medium text-zinc-300">
                  Original photo
                </h2>
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt="Uploaded schedule"
                    className="w-full rounded-lg object-contain"
                  />
                ) : (
                  <p className="text-sm text-zinc-500">Image unavailable.</p>
                )}
              </section>

              {/* Extracted shifts */}
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-zinc-300">
                    Extracted shifts ({shifts.length})
                  </h2>
                  <button
                    type="button"
                    onClick={addRow}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-50"
                  >
                    Add Row
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left">
                    <thead>
                      <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                        <th className="px-2 py-2 font-medium">Employee</th>
                        <th className="px-2 py-2 font-medium">Date</th>
                        <th className="px-2 py-2 font-medium">Start</th>
                        <th className="px-2 py-2 font-medium">End</th>
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {shifts.map((shift) => (
                        <tr
                          key={shift.key}
                          className={`border-b border-zinc-800/60 ${
                            shift.confidence === 'low' ? 'bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="px-1 py-1">
                            <input
                              value={shift.employee_name}
                              onChange={(e) =>
                                updateShift(shift.key, 'employee_name', e.target.value)
                              }
                              className={cellClass}
                              placeholder="Name"
                              aria-label="Employee name"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="date"
                              value={shift.date}
                              onChange={(e) =>
                                updateShift(shift.key, 'date', e.target.value)
                              }
                              className={cellClass}
                              aria-label="Date"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="time"
                              value={shift.start_time}
                              onChange={(e) =>
                                updateShift(shift.key, 'start_time', e.target.value)
                              }
                              className={cellClass}
                              aria-label="Start time"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="time"
                              value={shift.end_time}
                              onChange={(e) =>
                                updateShift(shift.key, 'end_time', e.target.value)
                              }
                              className={cellClass}
                              aria-label="End time"
                            />
                          </td>
                          <td className="px-1 py-1 text-right">
                            <button
                              type="button"
                              onClick={() => deleteRow(shift.key)}
                              className="rounded px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-red-950 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {shifts.length === 0 && (
                    <p className="py-6 text-center text-sm text-zinc-500">
                      No shifts extracted. Use “Add Row” to enter them manually.
                    </p>
                  )}
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={publishing || shifts.length === 0}
                    className={primaryButtonClass}
                  >
                    {publishing ? 'Publishing…' : 'Publish Schedule'}
                  </button>
                  <span className="text-xs text-zinc-500">
                    Creates {shifts.length} shift{shifts.length === 1 ? '' : 's'}.
                  </span>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
