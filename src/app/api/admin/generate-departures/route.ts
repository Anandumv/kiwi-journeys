import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSessions } from "@/lib/availability";

export const dynamic = "force-dynamic";

// Top up the rolling 90-day departure window for all active tours, using each
// tour's schedule stored in the DB. Idempotent.
export async function POST() {
  const tours = await prisma.tour.findMany({ where: { isActive: true } });
  let total = 0;
  const results: { tour: string; created: number }[] = [];
  for (const t of tours) {
    const created = await generateSessions({
      tourId: t.id,
      times: t.departureTimes,
      weekdays: t.departureWeekdays,
      capacity: t.capacityPerDeparture,
      horizonDays: 90,
      closedMonths: t.closedMonths,
    });
    total += created;
    results.push({ tour: t.title, created });
  }
  return NextResponse.json({ total, results });
}
