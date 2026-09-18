import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestVehicleName } from '../src/lib/vehicles';

const FLEET = [
  { name: 'Toyota RAV4', seats: 5 },
  { name: 'Toyota Vellfire', seats: 7 },
  { name: 'Mercedes Benz Sprinter', seats: 12 },
];

test('private tour group of 6 suggests the Vellfire', () => {
  assert.equal(suggestVehicleName(FLEET, 6), 'Toyota Vellfire');
});

test('private tour group of 20 suggests multiple vehicles', () => {
  assert.equal(suggestVehicleName(FLEET, 20), 'multiple vehicles — confirm with team');
});
