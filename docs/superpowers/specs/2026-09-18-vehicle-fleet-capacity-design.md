# Vehicle fleet capacity — design

Date: 2026-09-18
Status: approved, pending implementation plan

## Problem

The fleet is three vehicles: RAV4 (5 seats), Toyota Vellfire (7 seats), Mercedes Benz
Sprinter (12 seats). Nothing in the codebase models a vehicle. `Tour.capacityPerDeparture`
and `Session.capacity` are freehand integers with no link to which physical vehicle is
actually doing the run, and nothing stops the same vehicle being assigned to two
overlapping departures.

## Goals

- Scheduled-tour availability (`Session.capacity`) is derived from an actual assigned
  vehicle, not a typed number.
- A vehicle can't be assigned to two departures whose time windows overlap.
- Existing tours/sessions migrate to the new model without breaking current bookings
  or availability.
- Private-tour inquiries (still a pure email flow, no `Session`) get a vehicle
  suggestion based on group size, display-only.

## Non-goals

- Real booking/locking for private tours (they stay a manual email process).
- Buffer/turnaround time between two bookings on the same vehicle (e.g. drive-back time).
- Fleet scheduling beyond simple overlap prevention (no routing, no multi-leg logic).
- Retroactively enforcing the double-booking check against historical data.

## Schema

```prisma
model Vehicle {
  id       String    @id @default(cuid())
  name     String    // e.g. "Toyota RAV4"
  seats    Int
  isActive Boolean   @default(true)
  tours    Tour[]
  sessions Session[]
}

model Tour {
  // ...existing fields...
  defaultVehicleId String?
  defaultVehicle   Vehicle? @relation(fields: [defaultVehicleId], references: [id])
}

model Session {
  // ...existing fields...
  vehicleId String?
  vehicle   Vehicle? @relation(fields: [vehicleId], references: [id])
}
```

`Vehicle` is a real table of individual physical units (not an enum, not a
capacity-tier concept) — rejected the enum alternative because the business may add a
second unit of an existing type later, and an enum can't express "this exact vehicle
is busy at 2pm" without a rewrite.

`Session.capacity` is unchanged in shape and remains the field `src/lib/availability.ts`
reads for all seat math (holds, confirmed bookings, remaining seats). This spec does
not touch the inventory lock logic or lock ordering described in AGENTS.md. `capacity`
is now *populated* from `vehicle.seats` at session-creation time instead of typed
freehand by an admin.

Both new fields are nullable. A `Tour`/`Session` with no vehicle assigned behaves
exactly as it does today — this is additive, not a breaking migration of behavior.

## Assignment flow

- **Tour-level default**: each `Tour` has one `defaultVehicleId`, editable by an admin.
  Every `Session` generated for that tour inherits it unless overridden.
- **Per-session override**: a `Session` can be created/edited with a different
  `vehicleId` than its tour's default (one-off large groups, vehicle swaps).
- `capacity` is set to `vehicle.seats` whenever a vehicle is assigned or changed —
  it is derived, not independently editable, once a vehicle is picked.

## Double-booking prevention

Before creating or updating a `Session` with a given `vehicleId`, check for any other
`Session` with `status = SCHEDULED` on the same `vehicleId` whose window
`[startsAtUtc, startsAtUtc + tour.durationMins)` overlaps the new/updated session's
window. If one exists, reject with an error naming the conflicting tour and time —
surfaced inline in the admin UI.

This check applies at the two departure-generation entry points
(`/api/admin/generate-departures`, `/api/cron/generate-departures`) and the admin
"add one-off" / edit session forms. It does not apply to historical data during
migration (see below).

No buffer time is added between bookings in this pass — back-to-back bookings on the
same vehicle with zero gap are allowed. Known limitation, not handled here.

## Migration / backfill

1. Seed three `Vehicle` rows: RAV4 (5), Toyota Vellfire (7), Mercedes Benz Sprinter (12).
2. For each existing `Tour`, set `defaultVehicleId` to the smallest vehicle where
   `seats >= capacityPerDeparture`. If no vehicle is large enough (capacity > 12),
   assign the Sprinter and add that tour to a migration report for manual review.
3. Existing `Session` rows inherit their tour's newly-assigned vehicle and get
   `vehicleId` set accordingly. `Session.capacity` values are **not** rewritten during
   backfill — existing capacity numbers are left as-is so no already-scheduled
   departure's seat math changes.
4. The double-booking check is **not** run retroactively against backfilled data —
   doing so could false-positive on real operational history where two tours
   happened to map to the same vehicle tier by coincidence. Instead, the migration
   script prints a report of any resulting overlaps (same vehicle, overlapping
   windows, status SCHEDULED) for manual review. Going forward, all new/edited
   sessions are checked.

## Admin UI

- **Tour edit page** (`src/app/admin/tours/[id]/page.tsx`): replace the free-text
  "Capacity per departure" number field with a `Vehicle` dropdown (seat count shown
  per option). `capacityPerDeparture` becomes derived/synced from the selected
  vehicle rather than typed.
- **"Add one-off" session form** (same page): replace the capacity number input with
  a vehicle dropdown; capacity auto-fills from the selected vehicle's seats.
- Conflict errors from the double-booking check surface inline on both forms.

## Private tours (lightweight, display-only)

In `src/app/api/contact/private-tour/route.ts`, map the submitted `groupSize` to a
suggested vehicle name using the same seat thresholds (≤5 RAV4, ≤7 Vellfire, ≤12
Sprinter, >12 → "multiple vehicles — confirm with team") and include it in both the
staff notification and customer confirmation emails. No `Session`, no locking, no
capacity enforcement — purely informational text in the email body/subject, matching
how `groupSize` is already used today.

## Testing

- Unit tests for the double-booking overlap check (adjacent-but-not-overlapping is
  allowed; any overlap, including full containment, is rejected).
- Unit tests for the capacity-to-vehicle backfill matching logic, including the
  >12-seat fallback-and-flag case.
- Unit test for the private-tour vehicle suggestion thresholds.
- Existing `availability.ts` / booking test suite must continue passing unchanged,
  since `Session.capacity`'s role in seat math is untouched.

## Open limitations (explicitly out of scope)

- No buffer/turnaround time between vehicle bookings.
- No retroactive conflict enforcement against pre-existing schedule data (report only).
- Private tours remain unbooked/unlocked — the vehicle suggestion is advisory text only.
