import { timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual throws on length mismatch, which would itself leak length.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Shared cron authorization — every cron route uses this.
 *
 * Accepts the secret as a bearer header (preferred) or a query parameter, since
 * some schedulers cannot set headers. Compared in constant time so the secret
 * cannot be recovered a byte at a time from response timing.
 */
export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth && safeEqual(auth, `Bearer ${secret}`)) return true;
  const fromQuery = new URL(req.url).searchParams.get("secret");
  return !!fromQuery && safeEqual(fromQuery, secret);
}
