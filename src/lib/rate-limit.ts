// Fixed-window rate limiter held in process memory.
//
// Correct for the current deployment: a single long-lived Railway instance.
// If this app is ever scaled past one replica, each replica keeps its own
// counters and the effective limit multiplies by the replica count — swap the
// Map for a Redis counter at that point.

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

// Entries are only rewritten when the same key is seen again, so a process
// serving many one-off IPs would otherwise grow the Map forever. Sweep expired
// entries periodically instead of on every call.
const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  sweep(now);
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

export function rateLimitKey(req: Request, prefix: string): string {
  const forwarded = (req.headers as Headers).get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `${prefix}:${ip}`;
}

/** Test seam: drop all counters. */
export function __resetRateLimits() {
  store.clear();
  lastSweep = Date.now();
}
