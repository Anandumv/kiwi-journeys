#!/usr/bin/env -S npx tsx
// One-off report for reviewing the vehicle backfill (Task 1's migration).
// Run manually after deploy: npx tsx scripts/vehicle-migration-report.mjs
// Imports from src/lib/vehicles.ts, so this must run under tsx (not plain
// node) even though the file extension is .mjs, matching the rest of the
// TS-aware tooling in scripts/. Read-only — makes no changes.
import { PrismaClient } from "@prisma/client";
import { pickVehicleForCapacity } from "../src/lib/vehicles";

const prisma = new PrismaClient();

async function main() {
  const [tours, vehicles] = await Promise.all([
    prisma.tour.findMany({ select: { title: true, capacityPerDeparture: true, defaultVehicleId: true } }),
    prisma.vehicle.findMany({ select: { id: true, seats: true } }),
  ]);

  console.log(`\n=== Tours needing more than 12 seats (assigned Sprinter as fallback) ===`);
  const oversized = tours.filter((t) => t.capacityPerDeparture > 12);
  if (oversized.length === 0) console.log("(none)");
  for (const t of oversized) {
    console.log(`- ${t.title}: capacityPerDeparture=${t.capacityPerDeparture}`);
  }

  console.log(`\n=== Tours whose assigned vehicle doesn't match the matching rule (drift check) ===`);
  const drifted = tours.filter((t) => {
    const expected = pickVehicleForCapacity(vehicles, t.capacityPerDeparture);
    return expected && expected.vehicleId !== t.defaultVehicleId;
  });
  if (drifted.length === 0) console.log("(none)");
  for (const t of drifted) {
    console.log(`- ${t.title}: capacityPerDeparture=${t.capacityPerDeparture}, currently assigned=${t.defaultVehicleId ?? "none"}`);
  }

  const sessions = await prisma.session.findMany({
    where: { status: "SCHEDULED", vehicleId: { not: null }, startsAtUtc: { gt: new Date() } },
    select: { id: true, startsAtUtc: true, vehicleId: true, tour: { select: { title: true, durationMins: true } } },
    orderBy: { startsAtUtc: "asc" },
  });

  console.log(`\n=== Overlapping departures sharing the same vehicle ===`);
  let found = 0;
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const a = sessions[i];
      const b = sessions[j];
      if (a.vehicleId !== b.vehicleId) continue;
      const aEnd = a.startsAtUtc.getTime() + a.tour.durationMins * 60_000;
      if (b.startsAtUtc.getTime() >= aEnd) break; // sorted by start; no further overlap possible for this `a`
      found++;
      console.log(
        `- vehicle ${a.vehicleId}: "${a.tour.title}" @ ${a.startsAtUtc.toISOString()} overlaps "${b.tour.title}" @ ${b.startsAtUtc.toISOString()}`,
      );
    }
  }
  if (found === 0) console.log("(none)");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
