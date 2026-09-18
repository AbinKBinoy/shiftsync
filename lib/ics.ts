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

// Every shift's date/time is a plain wall-clock value with no timezone of
// its own — it's implicitly the department's real-world local time (there's
// no per-department timezone in the schema yet, so this is the one place
// that assumption is made explicit and can be changed later).
//
// This used to be written to the feed as RFC 5545 "floating" time (no Z, no
// TZID): correct per spec, but Google Calendar does not honor floating time
// for *subscribed* feeds — confirmed by generating a real feed with a known
// 10:00–18:00 shift and subscribing to it: Google displayed 3:00 AM–11:00 AM,
// exactly a 7-hour shift, which is 10:00 read as UTC and re-displayed in the
// (Pacific, UTC-7 in September) viewer's own calendar timezone. This is a
// widely-documented Google Calendar quirk, not unique to this app. TZID +
// VTIMEZONE is the more "textbook" RFC 5545 fix, but multiple independent
// reports (and Google's own support forum) note Google Calendar sometimes
// distrusts a feed's VTIMEZONE block and falls back to the same
// misinterpretation anyway — so the reliable fix is to sidestep floating
// time entirely and hand Google a real, unambiguous UTC instant instead.
//
// America/Vancouver, not America/Los_Angeles: the department is in
// Victoria, BC. Both observe the same DST schedule (Pacific Time), so this
// is a correctness fix for the source location, not a behavior change.
const DEPARTMENT_TIME_ZONE = 'America/Vancouver';

// The offset (in minutes, UTC minus zoned) a given instant sits at in
// `timeZone` — correctly DST-aware because it goes through Intl's own
// timezone database rather than a hardcoded offset. Standard
// dependency-free technique: format the instant's UTC clock-time as if it
// were already local to `timeZone`, then the gap between that reinterpreted
// instant and the true instant *is* the zone's offset at this moment.
function getTimeZoneOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
    .formatToParts(instant)
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return (asUTC - instant.getTime()) / 60_000;
}

// A wall-clock date+time in `timeZone` -> the real UTC instant it names.
// Two passes: the first treats the wall-clock value as a naive UTC guess
// purely so `getTimeZoneOffsetMinutes` has an instant to look up the zone's
// offset *around* (DST-correct for all but the literal ambiguous/skipped
// hour of a transition, an acceptable tradeoff over being off by a fixed
// number of hours every single day).
function zonedWallTimeToUTC(date: string, time: string, timeZone: string): Date {
  const [hours = '00', minutes = '00', seconds = '00'] = (time ?? '').split(':');
  const guess = new Date(`${date}T${hours}:${minutes}:${seconds.slice(0, 2)}Z`);
  const offsetMinutes = getTimeZoneOffsetMinutes(guess, timeZone);
  return new Date(guess.getTime() - offsetMinutes * 60_000);
}

// '2026-08-16' + '08:00:00' -> '20260816T150000Z' (the real UTC instant for
// that wall-clock time in DEPARTMENT_TIME_ZONE) — see the comment above for
// why this is UTC/Z rather than RFC 5545 floating time.
function toICSDateTime(date: string, time: string): string {
  const utc = zonedWallTimeToUTC(date, time, DEPARTMENT_TIME_ZONE);
  return utc.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
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
