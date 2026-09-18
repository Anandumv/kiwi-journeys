import { randomInt } from "node:crypto";

// Unambiguous alphabet — no O/0, I/1, so codes survive being read aloud.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Cryptographically random code body of `length` chars.
 *
 * Booking references, gift voucher codes and loyalty promo codes are bearer
 * values — a gift voucher carries a real NZD balance. `Math.random()` is a
 * seeded PRNG whose internal state can be recovered from observed output, so
 * holding one code could let an attacker predict the next ones. `randomInt`
 * draws from the OS CSPRNG and is unbiased across the alphabet.
 */
export function randomCode(length: number): string {
  let s = "";
  for (let i = 0; i < length; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

/** Booking reference, e.g. "KJ-4F7QXM". */
export function makeBookingReference(): string {
  return `KJ-${randomCode(6)}`;
}

/** Gift voucher code, e.g. "GV-4F7QXM2P". */
export function makeVoucherCode(): string {
  return `GV-${randomCode(8)}`;
}
