import type { Shift } from '@/types';

// RFC 5545 reserves these inside text values.
function escapeText(value: string): string {
  return (value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Content lines are capped at 75 octets; continuations start with a space.
function foldLine(line: string): string {
  if (line.length <= 75) return line;

  const parts: string[] = [];
  let remaining = line;
  parts.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);

  while (remaining.length > 74) {
    parts.push(' ' + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }

  if (remaining.length > 0) parts.push(' ' + remaining);
  return parts.join('\r\n');
}

// '2026-08-16' + '08:00:00' -> '20260816T080000' (floating local time, so a
// shift shows at its wall-clock hour rather than shifting with the viewer).
function toICSDateTime(date: string, time: string): string {
  const datePart = date.replace(/-/g, '');
  const [hours = '00', minutes = '00', seconds = '00'] = (time ?? '').split(':');
  return `${datePart}T${hours}${minutes}${seconds.slice(0, 2)}`;
}

function stamp(value?: string): string {
  const date = value ? new Date(value) : new Date();
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

type FeedShift = Shift & { department_name?: string };

function buildEvent(shift: FeedShift, departmentName: string): string[] {
  const summary = escapeText(`Work - ${departmentName}`);

  return [
    'BEGIN:VEVENT',
    foldLine(`UID:${shift.id}@shiftsync`),
    `DTSTAMP:${stamp(shift.created_at)}`,
    `DTSTART:${toICSDateTime(shift.date, shift.start_time)}`,
    `DTEND:${toICSDateTime(shift.date, shift.end_time)}`,
    foldLine(`SUMMARY:${summary}`),
    foldLine(`DESCRIPTION:${escapeText(departmentName)}`),
    'END:VEVENT',
  ];
}

// One-time export (CLAUDE.md pattern): every shift belongs to one department.
export function generateICS(shifts: Shift[], departmentName: string): string {
  const events = shifts.flatMap((shift) => buildEvent(shift, departmentName));

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ShiftSync//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

// Live subscription feed: shifts can span several departments, and calendar
// apps are told how often to poll.
export function generateCalendarFeed(
  shifts: FeedShift[],
  calendarName: string,
  refreshMinutes = 15
): string {
  const events = shifts.flatMap((shift) =>
    buildEvent(shift, shift.department_name ?? 'ShiftSync')
  );

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ShiftSync//EN',
    'CALSCALE:GREGORIAN',
    foldLine(`X-WR-CALNAME:${escapeText(calendarName)}`),
    foldLine(`NAME:${escapeText(calendarName)}`),
    `REFRESH-INTERVAL;VALUE=DURATION:PT${refreshMinutes}M`,
    `X-PUBLISHED-TTL:PT${refreshMinutes}M`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}
