import test from 'node:test';
import assert from 'node:assert/strict';
import {signBookingAccess,verifyBookingAccess} from '../src/lib/bookingAccess';
process.env.AUTH_SECRET='isolated-test-secret';
test('booking access is scoped to the verified booking',async()=>{
 const token=await signBookingAccess('KJ-TEST01');
 assert.equal(await verifyBookingAccess(token,'KJ-TEST01'),true);
 assert.equal(await verifyBookingAccess(token,'KJ-OTHER1'),false);
 assert.equal(await verifyBookingAccess('forged','KJ-TEST01'),false);
});
