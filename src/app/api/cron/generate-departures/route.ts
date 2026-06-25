import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSessions } from "@/lib/availability";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  const url = new URL(req.url);
  return auth === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

// Keep the rolling 90-day departure window topped up. Run daily.
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tours = await prisma.tour.findMany({ where: { isActive: true } });
  let total = 0;
  for (const t of tours) {
    total += await generateSessions({
      tourId: t.id,
      times: t.departureTimes,
      weekdays: t.departureWeekdays,
      capacity: t.capacityPerDeparture,
      horizonDays: 90,
      closedMonths: t.closedMonths,
    });
  }
  return NextResponse.json({ created: total });
}
