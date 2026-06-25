// Simple in-memory rate limiter. Sufficient for single-instance Railway deploys.
// For multi-instance deploys, swap the Map for a Redis counter.

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { allowed: boolean; remaining: number } {
  const now = Date.now();
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
