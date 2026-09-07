// Publish dates are calendar dates stored at UTC midnight, so every calculation
// here stays in UTC. Using local-time helpers would shift a post to the wrong day
// for anyone behind UTC — the bug that put Throwback Thursday on a Wednesday.

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function dateFromKey(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export function startOfMonth(date: Date): Date {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

export function addMonths(date: Date, months: number): Date {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth() + months, 1);
}

/** Sunday of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  return addDays(date, -date.getUTCDay());
}

export function monthKey(date: Date): string {
  return toDateKey(date).slice(0, 7);
}

/** Six Sunday-aligned weeks covering the month — a stable grid that never reflows. */
export function monthGrid(month: Date): Date[][] {
  const first = startOfWeek(startOfMonth(month));
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(first, week * 7 + day)),
  );
}

export function weekDays(anyDayInWeek: Date): Date[] {
  const first = startOfWeek(anyDayInWeek);
  return Array.from({ length: 7 }, (_, day) => addDays(first, day));
}

export function isSameMonth(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth()
  );
}

/** Today, truncated to a UTC calendar date so it can be compared with publish dates. */
export function todayUtc(): Date {
  const now = new Date();
  return utcDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

const utc = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });

export const formatMonthYear = utc({ month: "long", year: "numeric" });
export const formatDayLong = utc({
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
export const formatDayShort = utc({
  weekday: "short",
  month: "short",
  day: "numeric",
});
export const formatMedium = utc({
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Value for an <input type="date">, which expects YYYY-MM-DD. */
export function toDateInputValue(date: Date | null): string {
  return date ? toDateKey(date) : "";
}
