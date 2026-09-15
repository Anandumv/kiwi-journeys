# Kiwi Globe Tours — NZ Tour Booking Site

A New Zealand day-tour booking website (Next.js + TypeScript + Tailwind + Prisma/Postgres + Stripe)
with a full custom booking engine: calendar availability, package/price options, seat-hold reservations,
online payment, confirmation emails, and an admin dashboard.

Brand settings are managed through the database-backed CMS with defaults in `src/config/site.ts`.
See [the audit report](outputs/audit/REPORT.md) for verified behavior and remaining launch requirements.

The bundled reference photographs were not cleared for production in the original project documentation. Replace them with licensed assets or verify rights before publication.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4**
- **PostgreSQL** via **Prisma 6**
- **Stripe** (Payment Intents + embedded Payment Element)
- **Resend** for confirmation/contact email and customer sign-in

## Local setup

```bash
# 1. Postgres must be running and the DB created:
createdb kiwi_journeys                      # if not already created

# 2. Install + generate + migrate + seed
npm install
npx prisma migrate dev
npm run seed                                # NEW database only; may overwrite existing content

# 3. Run
npm run dev                                 # http://localhost:3000
```

### Environment (`.env`)

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Postgres connection string |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe test/live keys |
| `STRIPE_WEBHOOK_SECRET` | from `stripe listen` or the dashboard |
| `RESEND_API_KEY` + `BOOKINGS_FROM_EMAIL` | email delivery and customer sign-in; forms return unavailable if unset |
| `AUTH_SECRET` | signing secret for scoped admin/customer/booking sessions |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | bootstrap admin credentials; login verifies the database password hash |
| `CRON_SECRET` | protects `/api/cron/*` |
| `RESERVATION_HOLD_MINUTES` | seat-hold lifetime (default 10) |

## Enabling payments (Stripe test mode)

1. Get test keys from <https://dashboard.stripe.com/test/apikeys> and set `STRIPE_SECRET_KEY` +
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env`.
2. Forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the `whsec_…` it prints into `STRIPE_WEBHOOK_SECRET`, restart `npm run dev`.
3. Book a tour and pay with test card `4242 4242 4242 4242` (any future expiry/CVC).
   The booking is committed **only** when the `payment_intent.succeeded` webhook fires.

## How the booking engine works

- **Content** lives in `src/data/tours.ts` (10 tours) and is seeded into the DB.
- **Departures** (`Session` rows) are generated 90 days out from each tour's recurrence
  (times/weekdays/capacity), DST-safe in `Pacific/Auckland`.
- **Availability** is computed live: `capacity − confirmed bookings − active holds` — never stored.
- **Booking flow**: pick date → time slot → guests → `POST /api/reservations` creates a row-locked
  `HELD` reservation (`SELECT … FOR UPDATE` prevents overbooking) + a Stripe PaymentIntent →
  checkout with the Payment Element → the **webhook** commits the `Booking` (idempotent).
- **Holds expire** after 10 min; `/api/cron/expire-holds` (configure a scheduler; suggested every 5 min) sweeps them and
  cancels their PaymentIntents. `/api/cron/generate-departures` (daily) tops up the rolling window.
- **Abandoned checkout recovery**: `/api/cron/abandoned-recovery` (every 2 min) emails customers whose
  HELD reservation has contact info but is about to expire unpaid (one email per reservation).
- **Loyalty reward**: `/api/cron/loyalty-reward` (daily) emails a one-time 10%-off promo code to
  customers after their 2nd+ completed tour.
- **Admin** (`/admin`, authenticated session): bookings list, revenue, refunds, departure generation, gift vouchers.

## Verification scripts

```bash
npm test
npm run test:integration          # isolated localhost kiwi_journeys_audit_test database
npm run build
npm run typecheck
```

## Key files

| Path | Role |
|------|------|
| `src/config/site.ts` | all brand strings (rebrand here) |
| `src/data/tours.ts` | tour content (swap copy/images here) |
| `src/lib/availability.ts` | remaining-seats, session generation, **locked hold** (overbooking guard) |
| `src/lib/booking.ts` | booking commit + confirmation email |
| `src/app/api/reservations/route.ts` | create hold + PaymentIntent |
| `src/app/api/stripe/webhook/route.ts` | the only place a booking commits |
| `src/components/BookingWidget.tsx` | calendar + slots + quantity |
| `src/app/checkout/[reservationId]/page.tsx` | Stripe Payment Element |

## Before public launch

- Verify CMS business details, tour content, prices, and testimonial authenticity.
- Configure and test payment, email, uploads, and cron services; address the operational gaps in the audit report.
- Replace all images with your own **licensed** photography; rewrite tour copy as original content.
- Add real legal text (privacy, terms), production Stripe keys, a custom domain, and GST handling.


## Reliable delivery and payment recovery

Booking confirmations, gift voucher emails, and full-refund notifications are stored transactionally in `EmailJob`. The webhook attempts delivery after responding; a scheduler must also invoke `GET /api/cron/deliver-emails` every minute with `Authorization: Bearer <CRON_SECRET>` to recover failed or interrupted work. Alternatively, a scheduler with environment variables supplied can run `npx tsx scripts/cron.ts deliver-emails`.

The protected `/admin/operations` page shows pending email jobs and paid reservations that failed to become bookings. Retrying a payment checks its current state in Stripe; it never creates a new charge. Verified full refunds close the issue. Partial refunds require operator review.

Email retries preserve one immutable payload and idempotency key, stop after eight attempts or 23 hours, and require manual provider-log review after that limit. Resend keeps idempotency keys for 24 hours: https://resend.com/docs/dashboard/emails/idempotency-keys. Configure the sender before accepting bookings. WhatsApp delivery remains best-effort.
