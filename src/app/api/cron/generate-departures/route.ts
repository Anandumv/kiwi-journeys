import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSessions } from "@/lib/availability";
import { cronAuthorized } from "@/lib/cron";

export const dynamic = "force-dynamic";

// Keep the rolling 90-day departure window topped up. Run daily.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tours = await prisma.tour.findMany({ where: { isActive: true } });
  let total = 0;
  let totalConflicts = 0;
  for (const t of tours) {
    const { created, conflicts } = await generateSessions({
      tourId: t.id,
      times: t.departureTimes,
      weekdays: t.departureWeekdays,
      capacity: t.capacityPerDeparture,
      durationMins: t.durationMins,
      vehicleId: t.defaultVehicleId ?? undefined,
      horizonDays: 90,
      closedMonths: t.closedMonths,
    });
    total += created;
    totalConflicts += conflicts.length;
  }
  return NextResponse.json({ created: total, conflicts: totalConflicts });
}
