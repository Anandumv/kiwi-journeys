import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionsOverlap, suggestVehicleName, pickVehicleForCapacity } from '../src/lib/vehicles';

test('identical windows overlap', () => {
  const a = new Date('2026-10-01T08:30:00.000Z');
  assert.equal(sessionsOverlap(a, 240, a, 240), true);
});

test('adjacent windows (end === start) do not overlap', () => {
  const a = new Date('2026-10-01T08:30:00.000Z');
  const b = new Date('2026-10-01T12:30:00.000Z'); // a + 240min
  assert.equal(sessionsOverlap(a, 240, b, 240), false);
});

test('partial overlap is detected', () => {
  const a = new Date('2026-10-01T08:30:00.000Z');
  const b = new Date('2026-10-01T10:00:00.000Z'); // starts 90min into a's 240min window
  assert.equal(sessionsOverlap(a, 240, b, 240), true);
});

test('full containment is detected', () => {
  const a = new Date('2026-10-01T08:00:00.000Z');
  const b = new Date('2026-10-01T09:00:00.000Z'); // fully inside a's 6-hour window
  assert.equal(sessionsOverlap(a, 360, b, 30), true);
});

test('non-overlapping, far apart windows are fine', () => {
  const a = new Date('2026-10-01T08:30:00.000Z');
  const b = new Date('2026-10-02T08:30:00.000Z');
  assert.equal(sessionsOverlap(a, 240, b, 240), false);
});

const FLEET = [
  { name: 'Toyota RAV4', seats: 5 },
  { name: 'Toyota Vellfire', seats: 7 },
  { name: 'Mercedes Benz Sprinter', seats: 12 },
];

test('suggests the smallest vehicle that fits the group', () => {
  assert.equal(suggestVehicleName(FLEET, 4), 'Toyota RAV4');
  assert.equal(suggestVehicleName(FLEET, 5), 'Toyota RAV4');
  assert.equal(suggestVehicleName(FLEET, 6), 'Toyota Vellfire');
  assert.equal(suggestVehicleName(FLEET, 12), 'Mercedes Benz Sprinter');
});

test('groups larger than the fleet get a fallback message', () => {
  assert.equal(suggestVehicleName(FLEET, 13), 'multiple vehicles — confirm with team');
});

test('empty fleet always falls back', () => {
  assert.equal(suggestVehicleName([], 1), 'multiple vehicles — confirm with team');
});

const FLEET_IDS = [
  { id: 'veh_rav4', seats: 5 },
  { id: 'veh_vellfire', seats: 7 },
  { id: 'veh_sprinter', seats: 12 },
];

test('picks the smallest vehicle that fits the capacity, not flagged', () => {
  assert.deepEqual(pickVehicleForCapacity(FLEET_IDS, 6), { vehicleId: 'veh_vellfire', flagged: false });
});

test('exact-fit capacity picks that vehicle', () => {
  assert.deepEqual(pickVehicleForCapacity(FLEET_IDS, 12), { vehicleId: 'veh_sprinter', flagged: false });
});

test('capacity over the largest vehicle falls back to it, flagged', () => {
  assert.deepEqual(pickVehicleForCapacity(FLEET_IDS, 20), { vehicleId: 'veh_sprinter', flagged: true });
});

test('empty fleet has nothing to pick', () => {
  assert.equal(pickVehicleForCapacity([], 5), null);
});
