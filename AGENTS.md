<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


## Verified architecture and operating rules (2026-09-10)

- Next.js 16.2.9 uses async route params/cookies. Read installed Next docs before changes. Page modules cannot export arbitrary UI components; put shared admin UI in components/admin.
- Use the Webpack dev/build scripts. The local Turbopack build spawned excessive workers during this audit.
- Reservation creation, booking commit, and rescheduling must share Session inventory locks. Booking commit also locks Reservation; discount resources lock voucher before promo. Preserve this order to avoid deadlocks.
- Never trust a browser discount amount. Contact checkout validates and reserves voucher/promo availability, stores payableCents, and updates the PaymentIntent. The webhook verifies received amount/currency and intent ownership.
- A failed card attempt does not cancel a hold. Partial refunds do not release all seats. Late payments must recheck capacity and require reconciliation when inventory is unavailable.
- Admin, customer, and booking-view JWTs have separate audiences. A short booking reference alone must never reveal passenger details.
- Empty CMS results mean unpublished/empty content. Bundled tour/blog fallback is opt-in via CONTENT_DEMO_MODE=true.
- Integration tests run only against localhost kiwi_journeys_audit_test. Never use seed or destructive verification against an existing operational database. External notification/payment credentials are cleared by the integration runner.
- Production start applies migrations only, never seed. Seed is an explicit bootstrap operation that can overwrite existing data.
- A successful build or health route is not proof of payment/email delivery. Validate external services in test mode before launch; never log or request pasted secrets.
- Verification artifacts and remaining limitations are recorded in outputs/audit/REPORT.md.

- Booking, voucher activation, and full-refund email jobs must be created in the same database transaction as the state change. Payloads and provider idempotency keys are immutable. Do not restore fire-and-forget email sending.
- Email workers use SKIP LOCKED claims and lease tokens, at most eight attempts within 23 hours of the first attempt. Missing configuration preserves attempt counts. Configure deliver-emails every minute; inspect /admin/operations for stopped jobs and payment issues.
- This local PostgreSQL instance uses Asia/Kolkata. Prisma DateTime columns are UTC timestamp-without-timezone: raw SQL comparisons and database defaults for operational jobs must explicitly use `now() AT TIME ZONE 'UTC'`. Comparing against plain NOW() made fresh worker leases appear expired.
- A refund request is not a completed refund. Only a confirmed full charge refund releases seats; partial refunds require review. Retrieve current Stripe charge state when processing delayed payment-success events or retrying paid bookings.

## Deployment shape and scheduling (verified 2026-09-18)

- Production is Railway (project `zealous-rejoicing`, services `kiwi-journeys` + `Postgres`), deployed from `main` with `npm start`, which applies migrations. The `.vercel/` link and `vercel.json` are leftovers from an earlier host; Railway is authoritative. Do not re-add crons to `vercel.json`.
- Railway schedules cron per service, so a single-service deployment has no cron. The jobs run from `src/instrumentation.ts`, which calls the app's own `/api/cron/*` routes over loopback with `CRON_SECRET`, gated on `ENABLE_INTERNAL_CRON=true`. This is only correct at one replica: `deliver-emails` and `expire-holds` are concurrency-safe, the daily notification jobs are not. Move to dedicated cron services before scaling out.
- The app is one long-lived process, not per-request serverless functions. Prisma `connection_limit` must reflect that; a pool of 1 serializes the whole site and lets one slow checkout stall `/api/health` into a restart loop.
- Never hold a pooled connection across an external API call. Compute and persist inside the transaction, then call Stripe after it commits; the webhook's amount check is what makes that ordering safe.
- Missing Stripe/Resend credentials do not crash the app, they silently downgrade it (`/api/reservations` answers 503, email queues but never sends). `register()` logs every missing setting at boot and `/api/health` reports `payments`/`webhook`/`email`/`scheduler` so the degraded state is visible.

## Inventory and capacity

- `POST /api/reservations` is the only unauthenticated endpoint that takes inventory; it holds seats and opens a PaymentIntent, so it must stay rate limited.
- Migration `20260918105325_add_vehicle_fleet` overwrote every `Tour.capacityPerDeparture` with its assigned vehicle's seat count, in both directions, and the original values are gone. `Session.capacity` on already-scheduled departures is the only surviving record of the pre-migration values — `scripts/vehicle-migration-report.mjs` reads it to report what changed. Any future check written against `Tour.capacityPerDeparture` alone compares the new value with itself and reports nothing.
- Bearer values (booking references, gift voucher codes, loyalty promo codes, upload filenames) come from `src/lib/codes.ts`, which uses the OS CSPRNG. Do not reintroduce `Math.random()` for these.
- Stored upload extensions are derived from the validated MIME type, never from the client-supplied filename.
