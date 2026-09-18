-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "vehicleId" TEXT;

-- AlterTable
ALTER TABLE "Tour" ADD COLUMN     "defaultVehicleId" TEXT;

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Tour" ADD CONSTRAINT "Tour_defaultVehicleId_fkey" FOREIGN KEY ("defaultVehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the fleet.
INSERT INTO "Vehicle" ("id", "name", "seats", "isActive") VALUES
  ('veh_rav4', 'Toyota RAV4', 5, true),
  ('veh_vellfire', 'Toyota Vellfire', 7, true),
  ('veh_sprinter', 'Mercedes Benz Sprinter', 12, true);

-- Backfill each existing tour with the smallest vehicle that fits its current
-- capacity. Tours needing more than 12 seats fall back to the Sprinter; the
-- post-deploy report script (Task 9) lists these for manual review.
UPDATE "Tour" t SET "defaultVehicleId" = (
  SELECT v.id FROM "Vehicle" v
  WHERE v.seats >= t."capacityPerDeparture"
  ORDER BY v.seats ASC
  LIMIT 1
);
UPDATE "Tour" SET "defaultVehicleId" = 'veh_sprinter' WHERE "defaultVehicleId" IS NULL;

-- Existing sessions inherit their tour's newly-assigned vehicle. Capacity
-- values are intentionally left untouched so no already-scheduled
-- departure's seat math changes.
UPDATE "Session" s SET "vehicleId" = t."defaultVehicleId"
FROM "Tour" t
WHERE s."tourId" = t.id;
