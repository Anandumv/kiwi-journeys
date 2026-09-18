/**
 * True if two [start, start+durationMins) windows overlap. Adjacent windows
 * (one ends exactly when the other starts) do not count as overlapping.
 */
export function sessionsOverlap(
  aStart: Date,
  aDurationMins: number,
  bStart: Date,
  bDurationMins: number,
): boolean {
  const aEnd = aStart.getTime() + aDurationMins * 60_000;
  const bEnd = bStart.getTime() + bDurationMins * 60_000;
  return aStart.getTime() < bEnd && bStart.getTime() < aEnd;
}

export type VehicleOption = { name: string; seats: number };

/**
 * Smallest vehicle whose seats cover groupSize, or a fallback message when
 * nothing in the fleet is big enough. Display-only — never used for capacity
 * enforcement.
 */
export function suggestVehicleName(vehicles: VehicleOption[], groupSize: number): string {
  const fitting = vehicles
    .filter((v) => v.seats >= groupSize)
    .sort((a, b) => a.seats - b.seats);
  return fitting[0]?.name ?? 'multiple vehicles — confirm with team';
}

export type VehicleCandidate = { id: string; seats: number };

/**
 * Smallest vehicle whose seats cover the capacity, or the largest available
 * vehicle flagged for manual review when nothing fits. Mirrors the matching
 * logic in the Task 1 migration's backfill SQL — used here only for unit
 * testing and post-deploy drift detection (scripts/vehicle-migration-report.mjs),
 * not called from the migration itself.
 */
export function pickVehicleForCapacity(
  vehicles: VehicleCandidate[],
  capacity: number,
): { vehicleId: string; flagged: boolean } | null {
  if (vehicles.length === 0) return null;
  const sorted = [...vehicles].sort((a, b) => a.seats - b.seats);
  const fit = sorted.find((v) => v.seats >= capacity);
  if (fit) return { vehicleId: fit.id, flagged: false };
  return { vehicleId: sorted[sorted.length - 1].id, flagged: true };
}
