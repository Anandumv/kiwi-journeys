import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

export const NZ_TZ = "Pacific/Auckland";

/**
 * Convert an Auckland local date + "HH:mm" into the correct UTC instant,
 * DST-safe (NZDT UTC+13 / NZST UTC+12 handled by the zone database).
 */
export function aucklandLocalToUtc(localDateYmd: string, hhmm: string): Date {
  // localDateYmd: "2026-07-15", hhmm: "08:30"
  return fromZonedTime(`${localDateYmd}T${hhmm}:00`, NZ_TZ);
}

/** Auckland calendar date (midnight Auckland) as a UTC Date, for @db.Date storage. */
export function aucklandDateOnly(localDateYmd: string): Date {
  // Store as midnight UTC of that calendar date — Prisma @db.Date ignores time.
  return new Date(`${localDateYmd}T00:00:00.000Z`);
}

/** "YYYY-MM-DD" for a given instant, in Auckland time. */
export function ymdInAuckland(d: Date): string {
  return formatInTimeZone(d, NZ_TZ, "yyyy-MM-dd");
}

/** Today's Auckland calendar date as "YYYY-MM-DD". */
export function todayInAuckland(now: Date = new Date()): string {
  return ymdInAuckland(now);
}

/** Human time, e.g. "8:30 AM" in Auckland. */
export function timeLabel(d: Date): string {
  return formatInTimeZone(d, NZ_TZ, "h:mm a");
}

/** Human date, e.g. "Wednesday, 15 July 2026" in Auckland. */
export function dateLabel(d: Date): string {
  return formatInTimeZone(d, NZ_TZ, "EEEE, d MMMM yyyy");
}

/** Short date, e.g. "Wed 15 Jul" in Auckland. */
export function shortDateLabel(d: Date): string {
  return formatInTimeZone(d, NZ_TZ, "EEE d MMM");
}

export { toZonedTime, formatInTimeZone };
