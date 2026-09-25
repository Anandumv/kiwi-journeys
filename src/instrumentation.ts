/**
 * In-process scheduler for the /api/cron/* jobs.
 *
 * These jobs are not optional extras. Without `deliver-emails` running, a
 * booking confirmation whose first delivery attempt fails is never retried and
 * the customer is simply never told their booking exists; without
 * `expire-holds`, abandoned checkouts keep their Stripe PaymentIntents alive;
 * without `generate-departures`, the booking calendar runs dry at the end of
 * the rolling horizon.
 *
 * Railway schedules cron per service, which needs a separate service per job.
 * This app instead runs one long-lived process, so the jobs are driven from
 * inside it. Each tick calls the app's own route over loopback with
 * CRON_SECRET, so the scheduled path and the externally-triggered path are the
 * same code — an external scheduler can still be pointed at these routes and
 * this can be switched off.
 *
 * Every job tolerates running on several replicas at once: `deliver-emails`
 * and `expire-holds` use SKIP LOCKED leases and atomic updates, departures are
 * unique per tour and start time, and notification jobs claim their rows and
 * queue emails with ids derived from the booking/entry (`enqueueUniqueEmails`),
 * so overlapping runs add nothing. Extra replicas only add redundant ticks.
 */

type Job = { name: string; path: string; everyMs: number; firstRunMs: number };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const JOBS: Job[] = [
  { name: "deliver-emails", path: "/api/cron/deliver-emails", everyMs: MINUTE, firstRunMs: 20_000 },
  { name: "expire-holds", path: "/api/cron/expire-holds", everyMs: 10 * MINUTE, firstRunMs: 40_000 },
  { name: "abandoned-recovery", path: "/api/cron/abandoned-recovery", everyMs: 2 * MINUTE, firstRunMs: 60_000 },
  { name: "send-reminders", path: "/api/cron/send-reminders", everyMs: HOUR, firstRunMs: 90_000 },
  { name: "waitlist-notify", path: "/api/cron/waitlist-notify", everyMs: HOUR, firstRunMs: 110_000 },
  { name: "generate-departures", path: "/api/cron/generate-departures", everyMs: 24 * HOUR, firstRunMs: 130_000 },
  { name: "post-tour-survey", path: "/api/cron/post-tour-survey", everyMs: 24 * HOUR, firstRunMs: 150_000 },
  { name: "loyalty-reward", path: "/api/cron/loyalty-reward", everyMs: 24 * HOUR, firstRunMs: 170_000 },
];

/**
 * Required settings, checked once at boot.
 *
 * Missing payment and email credentials do not crash the app — they silently
 * downgrade it: /api/reservations starts answering 503 "payments temporarily
 * unavailable" and every email is queued but never delivered. That is close to
 * invisible from the outside, so say it loudly in the logs at startup.
 */
function reportEnvironment() {
  const required: Record<string, string> = {
    DATABASE_URL: "database",
    AUTH_SECRET: "admin and customer sessions",
    NEXT_PUBLIC_BASE_URL: "links in outbound email",
  };
  const paymentsAndEmail: Record<string, string> = {
    STRIPE_SECRET_KEY: "taking payments",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "the checkout card form",
    STRIPE_WEBHOOK_SECRET: "committing paid bookings",
    RESEND_API_KEY: "sending any email",
    BOOKINGS_FROM_EMAIL: "the sender address on booking email",
    CRON_SECRET: "scheduled jobs",
  };

  const missingRequired = Object.keys(required).filter((k) => !process.env[k]);
  const missingRuntime = Object.keys(paymentsAndEmail).filter((k) => !process.env[k]);

  for (const key of missingRequired) {
    console.error(`[startup] MISSING ${key} — needed for ${required[key]}.`);
  }
  for (const key of missingRuntime) {
    console.error(`[startup] MISSING ${key} — ${paymentsAndEmail[key]} is DISABLED.`);
  }
  if (missingRuntime.includes("STRIPE_SECRET_KEY") || missingRuntime.includes("STRIPE_WEBHOOK_SECRET")) {
    console.error("[startup] This instance CANNOT take bookings until the Stripe keys are set.");
  }
  if (missingRequired.length === 0 && missingRuntime.length === 0) {
    console.log("[startup] All payment, email and scheduling settings are present.");
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") reportEnvironment();

  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.ENABLE_INTERNAL_CRON !== "true") return;

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] ENABLE_INTERNAL_CRON is set but CRON_SECRET is not — scheduler disabled.");
    return;
  }

  const base = `http://127.0.0.1:${process.env.PORT || 3000}`;
  const running = new Set<string>();

  const runJob = async (job: Job) => {
    // A slow run must not stack up behind itself.
    if (running.has(job.name)) {
      console.warn(`[cron] ${job.name}: previous run still in progress, skipping this tick`);
      return;
    }
    running.add(job.name);
    try {
      const res = await fetch(`${base}${job.path}`, {
        headers: { authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(5 * MINUTE),
      });
      const detail = await res.text().catch(() => "");
      if (!res.ok) console.error(`[cron] ${job.name}: HTTP ${res.status} ${detail.slice(0, 300)}`);
      else console.log(`[cron] ${job.name}: ${detail.slice(0, 300)}`);
    } catch (e) {
      console.error(`[cron] ${job.name} failed:`, e);
    } finally {
      running.delete(job.name);
    }
  };

  for (const job of JOBS) {
    // Staggered so a restart doesn't fire every job at once, and delayed so the
    // first tick lands after the server is accepting connections.
    setTimeout(() => {
      void runJob(job);
      setInterval(() => void runJob(job), job.everyMs);
    }, job.firstRunMs);
  }

  console.log(`[cron] internal scheduler started for ${JOBS.length} jobs`);
}
