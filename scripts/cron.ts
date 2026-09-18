#!/usr/bin/env tsx
/**
 * Cron runner — call from Railway cron services or any scheduler.
 *
 * Railway setup:
 *   Service 1 (expire-holds):    tsx scripts/cron.ts expire-holds   — every 10 minutes
 *   Service 2 (gen-departures):  tsx scripts/cron.ts gen-departures  — daily at 02:00 UTC
 *
 * Requires DATABASE_URL and (optionally) STRIPE_SECRET_KEY in environment.
 */

import { expireStaleHolds } from "../src/lib/availability";

const job = process.argv[2];

async function run() {
  if (job === "deliver-emails") {
    const { processEmailJobs } = await import("../src/lib/email-jobs");
    console.log(await processEmailJobs(20));
    const { prisma } = await import("../src/lib/db");
    await prisma.$disconnect();
    return;
  }
  if (job === "expire-holds") {
    console.log("[cron] expire-holds starting");
    const expired = await expireStaleHolds();
    console.log(`[cron] expire-holds: ${expired.length} holds expired`);
    return;
  }

  if (job === "gen-departures") {
    console.log("[cron] gen-departures starting");
    // Lazy import to avoid loading all deps at startup.
    const { prisma } = await import("../src/lib/db");
    const { generateSessions } = await import("../src/lib/availability");
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
    console.log(`[cron] gen-departures: ${total} sessions created, ${totalConflicts} vehicle conflicts (created anyway, review needed)`);
    await prisma.$disconnect();
    return;
  }

  console.error(`[cron] Unknown job: ${job}. Use 'expire-holds', 'gen-departures', or 'deliver-emails'.`);
  process.exit(1);
}

run().catch((e) => {
  console.error("[cron] Fatal:", e);
  process.exit(1);
});
