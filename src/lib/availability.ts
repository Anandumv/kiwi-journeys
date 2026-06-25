import { prisma } from "./db";
import { Prisma } from "@prisma/client";
import { aucklandLocalToUtc, aucklandDateOnly, ymdInAuckland, todayInAuckland } from "./time";

// ─── Session generation ──────────────────────────────────────────────────────

export type GenerateParams = {
  tourId: string;
  times: string[]; // ["08:30", ...] Auckland local
  weekdays: number[]; // 1=Mon..7=Sun
  capacity: number;
  horizonDays: number;
  closedMonths?: number[]; // 1-12 (Auckland month) the tour does not run
  fromDate?: string; // YYYY-MM-DD Auckland; defaults to today
};

/** Iterate Auckland calendar dates from `start` for `days`, yielding "YYYY-MM-DD". */
function* aucklandDateRange(startYmd: string, days: number): Generator<string> {
  const [y, m, d] = startYmd.split("-").map(Number);
  // Use a UTC anchor at noon to avoid any date rollover; we only use the y/m/d.
  const base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  for (let i = 0; i < days; i++) {
    const cur = new Date(base.getTime() + i * 86400000);
    const yy = cur.getUTCFullYear();
    const mm = String(cur.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(cur.getUTCDate()).padStart(2, "0");
    yield `${yy}-${mm}-${dd}`;
  }
}

/** ISO weekday 1=Mon..7=Sun for a "YYYY-MM-DD" (interpreted as a plain calendar date). */
function isoWeekday(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun..6=Sat
  return wd === 0 ? 7 : wd;
}

/**
 * Idempotently create Session rows over the horizon. Re-running is safe thanks
 * to the unique (tourId, startsAtUtc) constraint — existing sessions are skipped.
 * Returns the number of newly created sessions.
 */
export async function generateSessions(params: GenerateParams): Promise<number> {
  const start = params.fromDate ?? todayInAuckland();
  const rows: Prisma.SessionCreateManyInput[] = [];
  for (const ymd of aucklandDateRange(start, params.horizonDays)) {
    if (!params.weekdays.includes(isoWeekday(ymd))) continue;
    const month = Number(ymd.split("-")[1]);
    if (params.closedMonths?.includes(month)) continue;
    for (const t of params.times) {
      rows.push({
        tourId: params.tourId,
        startsAtUtc: aucklandLocalToUtc(ymd, t),
        localDate: aucklandDateOnly(ymd),
        capacity: params.capacity,
      });
    }
  }
  if (rows.length === 0) return 0;
  const res = await prisma.session.createMany({ data: rows, skipDuplicates: true });
  return res.count;
}

// ─── Remaining-seats computation ───────────────────────────────────────────────

/**
 * Authoritative remaining seats for a set of sessions:
 *   capacity − Σ(confirmed booking seats) − Σ(active HELD reservation seats)
 * Computed live so it can never drift. Expired holds are excluded automatically.
 */
export async function remainingForSessions(
  sessionIds: string[],
  now: Date = new Date(),
): Promise<Map<string, number>> {
  if (sessionIds.length === 0) return new Map();

  const [sessions, bookings, holds] = await Promise.all([
    prisma.session.findMany({
      where: { id: { in: sessionIds } },
      select: { id: true, capacity: true, status: true },
    }),
    prisma.booking.groupBy({
      by: ["sessionId"],
      where: { sessionId: { in: sessionIds }, status: "CONFIRMED" },
      _sum: { seats: true },
    }),
    prisma.reservation.groupBy({
      by: ["sessionId"],
      where: { sessionId: { in: sessionIds }, status: "HELD", expiresAt: { gt: now } },
      _sum: { seats: true },
    }),
  ]);

  const booked = new Map(bookings.map((b) => [b.sessionId, b._sum.seats ?? 0]));
  const held = new Map(holds.map((h) => [h.sessionId, h._sum.seats ?? 0]));

  const out = new Map<string, number>();
  for (const s of sessions) {
    if (s.status === "CANCELLED") {
      out.set(s.id, 0);
      continue;
    }
    const remaining = s.capacity - (booked.get(s.id) ?? 0) - (held.get(s.id) ?? 0);
    out.set(s.id, Math.max(0, remaining));
  }
  return out;
}

// ─── Calendar / month availability ─────────────────────────────────────────────

export type SessionAvailability = {
  sessionId: string;
  startsAtUtc: string;
  remaining: number;
  capacity: number;
};

export type DayAvailability = {
  date: string; // YYYY-MM-DD Auckland
  sessions: SessionAvailability[];
  remaining: number; // sum across the day
};

/** Availability for a tour across a calendar month (Auckland), keyed by date. */
export async function getMonthAvailability(
  tourId: string,
  year: number,
  month: number, // 1-12
  now: Date = new Date(),
): Promise<DayAvailability[]> {
  const startYmd = `${year}-${String(month).padStart(2, "0")}-01`;
  const start = aucklandDateOnly(startYmd);
  // exclusive end = first day of next month
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const end = aucklandDateOnly(`${endYear}-${String(endMonth).padStart(2, "0")}-01`);

  const sessions = await prisma.session.findMany({
    where: {
      tourId,
      status: "SCHEDULED",
      localDate: { gte: start, lt: end },
      startsAtUtc: { gt: now }, // only future departures are bookable
    },
    select: { id: true, startsAtUtc: true, capacity: true, localDate: true },
    orderBy: { startsAtUtc: "asc" },
  });

  const remaining = await remainingForSessions(sessions.map((s) => s.id), now);

  const byDate = new Map<string, DayAvailability>();
  for (const s of sessions) {
    const date = ymdInAuckland(s.startsAtUtc);
    if (!byDate.has(date)) byDate.set(date, { date, sessions: [], remaining: 0 });
    const rem = remaining.get(s.id) ?? 0;
    const day = byDate.get(date)!;
    day.sessions.push({
      sessionId: s.id,
      startsAtUtc: s.startsAtUtc.toISOString(),
      remaining: rem,
      capacity: s.capacity,
    });
    day.remaining += rem;
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Reservation hold (overbooking guard) ──────────────────────────────────────

export type CartLine = {
  priceOptionId: string;
  key: string;
  label: string;
  unitPriceCents: number;
  qty: number;
  seats: number;
};

export class SoldOutError extends Error {
  constructor(public available: number) {
    super("SOLD_OUT");
    this.name = "SoldOutError";
  }
}

/**
 * Create a HELD reservation inside a row-locked transaction so concurrent
 * buyers of the last seats are serialized. Throws SoldOutError if insufficient.
 * Returns the created reservation id + total.
 */
export async function createHold(args: {
  sessionId: string;
  lines: CartLine[];
  holdMinutes: number;
  now?: Date;
}): Promise<{ reservationId: string; totalCents: number; seats: number; expiresAt: Date }> {
  const now = args.now ?? new Date();
  const seatsRequested = args.lines.reduce((n, l) => n + l.seats, 0);
  const totalCents = args.lines.reduce((n, l) => n + l.unitPriceCents * l.qty, 0);
  if (seatsRequested <= 0) throw new Error("No seats requested");

  return prisma.$transaction(async (tx) => {
    // Lock this session's row; concurrent holds queue behind us.
    const locked = await tx.$queryRaw<{ id: string; capacity: number; status: string }[]>(
      Prisma.sql`SELECT id, capacity, status FROM "Session" WHERE id = ${args.sessionId} FOR UPDATE`,
    );
    if (locked.length === 0) throw new Error("Session not found");
    const session = locked[0];
    if (session.status !== "SCHEDULED") throw new SoldOutError(0);

    // Recompute remaining under the lock.
    const [bookedAgg, heldAgg] = await Promise.all([
      tx.booking.aggregate({
        where: { sessionId: args.sessionId, status: "CONFIRMED" },
        _sum: { seats: true },
      }),
      tx.reservation.aggregate({
        where: { sessionId: args.sessionId, status: "HELD", expiresAt: { gt: now } },
        _sum: { seats: true },
      }),
    ]);
    const remaining =
      session.capacity - (bookedAgg._sum.seats ?? 0) - (heldAgg._sum.seats ?? 0);

    if (seatsRequested > remaining) {
      throw new SoldOutError(Math.max(0, remaining));
    }

    const expiresAt = new Date(now.getTime() + args.holdMinutes * 60_000);
    const reservation = await tx.reservation.create({
      data: {
        sessionId: args.sessionId,
        seats: seatsRequested,
        totalCents,
        status: "HELD",
        expiresAt,
        cartSnapshot: args.lines as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    return { reservationId: reservation.id, totalCents, seats: seatsRequested, expiresAt };
  });
}

/** Mark stale HELD reservations as EXPIRED. Returns affected count. */
export async function expireStaleHolds(now: Date = new Date()): Promise<string[]> {
  const stale = await prisma.reservation.findMany({
    where: { status: "HELD", expiresAt: { lt: now } },
    select: { id: true, stripePaymentIntentId: true },
  });
  if (stale.length === 0) return [];
  await prisma.reservation.updateMany({
    where: { id: { in: stale.map((s) => s.id) } },
    data: { status: "EXPIRED" },
  });
  return stale.map((s) => s.stripePaymentIntentId).filter((x): x is string => !!x);
}
