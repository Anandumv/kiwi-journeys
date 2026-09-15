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
