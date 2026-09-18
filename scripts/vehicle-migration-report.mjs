#!/usr/bin/env -S npx tsx
// Post-deploy review for the vehicle fleet backfill (migration
// 20260918105325_add_vehicle_fleet). Run manually after deploy:
//
//   railway run npx tsx scripts/vehicle-migration-report.mjs
//
// Imports from src/lib/vehicles.ts, so this must run under tsx (not plain
// node) even though the file extension is .mjs. Read-only — makes no changes.
//
// Why it reads Session.capacity rather than Tour.capacityPerDeparture:
// the migration's last statement overwrote every tour's capacityPerDeparture
// with its assigned vehicle's seat count, so any check against that column
// compares the new value with itself and reports nothing, by construction.
// The migration deliberately left Session.capacity alone, so already-scheduled
// departures still carry the pre-migration capacity. That is the only
// surviving record of what each tour's capacity used to be.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tours = await prisma.tour.findMany({
    select: {
      id: true,
      title: true,
      capacityPerDeparture: true,
      defaultVehicle: { select: { name: true, seats: true } },
      sessions: {
        where: { status: "SCHEDULED", startsAtUtc: { gt: new Date() } },
        select: { capacity: true },
      },
    },
  });

  const changed = [];
  for (const t of tours) {
    if (t.sessions.length === 0) continue;
    // Departures generated before the migration all carry the tour's old
    // capacity; take the highest in case capacity was edited mid-schedule.
    const previous = Math.max(...t.sessions.map((s) => s.capacity));
    if (previous !== t.capacityPerDeparture) {
      changed.push({ ...t, previous, delta: t.capacityPerDeparture - previous });
    }
  }

  console.log(`\n=== Tours whose capacity the migration CHANGED ===`);
  if (changed.length === 0) console.log("(none)");
  for (const t of changed) {
    const dir = t.delta > 0 ? "RAISED" : "CUT";
    console.log(
      `- ${t.title}: ${t.previous} -> ${t.capacityPerDeparture} (${dir} by ${Math.abs(t.delta)}) ` +
        `via ${t.defaultVehicle?.name ?? "no vehicle"} (${t.defaultVehicle?.seats ?? "?"} seats)`,
    );
  }

  console.log(`\n=== OVERSELL RISK: capacity raised above what the operator had set ===`);
  const raised = changed.filter((t) => t.delta > 0);
  if (raised.length === 0) console.log("(none)");
  for (const t of raised) {
    console.log(
      `- ${t.title}: now sells ${t.capacityPerDeparture} seats per departure, operator had set ${t.previous}. ` +
        `Confirm ${t.defaultVehicle?.name} genuinely seats ${t.capacityPerDeparture} paying guests, or lower it in admin.`,
    );
  }

  console.log(`\n=== UNDER-CAPACITY: tours that needed more seats than the fleet offers ===`);
  const cut = changed.filter((t) => t.delta < 0);
  if (cut.length === 0) console.log("(none)");
  for (const t of cut) {
    console.log(
      `- ${t.title}: was ${t.previous}, now capped at ${t.capacityPerDeparture} by ${t.defaultVehicle?.name}. ` +
        `Add a larger vehicle to the fleet if this tour really ran at ${t.previous}.`,
    );
  }

  // Existing departures kept their original capacity, so a tour whose capacity
  // was cut still has scheduled departures selling more seats than the assigned
  // vehicle holds.
  console.log(`\n=== Scheduled departures selling more seats than their assigned vehicle ===`);
  const overSized = await prisma.session.findMany({
    where: { status: "SCHEDULED", startsAtUtc: { gt: new Date() }, vehicleId: { not: null } },
    select: {
      startsAtUtc: true,
      capacity: true,
      vehicle: { select: { name: true, seats: true } },
      tour: { select: { title: true } },
    },
    orderBy: { startsAtUtc: "asc" },
  });
  const overbooked = overSized.filter((s) => s.vehicle && s.capacity > s.vehicle.seats);
  if (overbooked.length === 0) console.log("(none)");
  for (const s of overbooked) {
    console.log(
      `- "${s.tour.title}" @ ${s.startsAtUtc.toISOString()}: sells ${s.capacity}, ` +
        `${s.vehicle.name} seats ${s.vehicle.seats}`,
    );
  }

  console.log(`\n=== Overlapping departures sharing the same vehicle ===`);
  const sessions = await prisma.session.findMany({
    where: { status: "SCHEDULED", vehicleId: { not: null }, startsAtUtc: { gt: new Date() } },
    select: {
      startsAtUtc: true,
      vehicleId: true,
      tour: { select: { title: true, durationMins: true } },
    },
    orderBy: { startsAtUtc: "asc" },
  });
  let found = 0;
  for (let i = 0; i < sessions.length; i++) {
    const a = sessions[i];
    const aEnd = a.startsAtUtc.getTime() + a.tour.durationMins * 60_000;
    for (let j = i + 1; j < sessions.length; j++) {
      const b = sessions[j];
      // Sorted by start, so once b starts after a ends nothing later overlaps a.
      if (b.startsAtUtc.getTime() >= aEnd) break;
      if (a.vehicleId !== b.vehicleId) continue;
      found++;
      console.log(
        `- vehicle ${a.vehicleId}: "${a.tour.title}" @ ${a.startsAtUtc.toISOString()} overlaps "${b.tour.title}" @ ${b.startsAtUtc.toISOString()}`,
      );
    }
  }
  if (found === 0) console.log("(none)");

  console.log("");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
