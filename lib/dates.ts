// All shift dates are plain 'YYYY-MM-DD' strings with no timezone. Parsing them
// with `new Date(str)` treats them as UTC midnight, which renders as the
// previous day in any negative-offset timezone — so build dates from local
// components instead, and never round-trip through UTC.

// 1 = Monday, 0 = Sunday. Change this to 0 for a Sunday–Saturday week.
export const WEEK_STARTS_ON: 0 | 1 = 1;

export const WEEKDAY_LABELS =
  WEEK_STARTS_ON === 1
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function startOfWeek(date: Date): Date {
  const start = new Date(date);
  const diff = (start.getDay() - WEEK_STARTS_ON + 7) % 7;
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

// "Aug 17 – Aug 23, 2026"
export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const short = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${short(weekStart)} – ${short(weekEnd)}, ${weekEnd.getFullYear()}`;
}

// "Monday, August 17, 2026"
export function formatFullDate(value: string): string {
  return parseISODate(value).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// Postgres returns "08:00:00"; the grid only needs "08:00".
export function formatTime(value: string): string {
  const match = /^(\d{2}:\d{2})/.exec(value ?? '');
  return match ? match[1] : (value ?? '');
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}
