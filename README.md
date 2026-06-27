# Kiwi Journeys — NZ Tour Booking Site

A New Zealand day-tour booking website (Next.js + TypeScript + Tailwind + Prisma/Postgres + Stripe)
with a full custom booking engine: calendar availability, package/price options, seat-hold reservations,
online payment, confirmation emails, and an admin dashboard.

> **Branding is placeholder** ("Kiwi Journeys"). All brand strings live in `src/config/site.ts` —
> edit that one file to rebrand. Replace placeholder images in `public/images/` with your own
> **licensed** photography before going public (the bundled photos are from a scraped reference and
> are not cleared for production use).

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4**
- **PostgreSQL** via **Prisma 6**
- **Stripe** (Payment Intents + embedded Payment Element)
- **Resend** for confirmation/contact email (optional)

## Local setup

```bash
# 1. Postgres must be running and the DB created:
createdb kiwi_journeys                      # if not already created

# 2. Install + generate + migrate + seed
npm install
npx prisma migrate dev
npm run seed                                # tours, price options, 90-day departures

# 3. Run
npm run dev                                 # http://localhost:3000
```

### Environment (`.env`)

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Postgres connection string |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe test/live keys |
| `STRIPE_WEBHOOK_SECRET` | from `stripe listen` or the dashboard |
| `RESEND_API_KEY` + `BOOKINGS_FROM_EMAIL` | confirmation emails (optional; logs to console if unset) |
| `ADMIN_TOKEN` | password for `/admin` |
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
- **Holds expire** after 10 min; `/api/cron/expire-holds` (Vercel Cron, every 5 min) sweeps them and
  cancels their PaymentIntents. `/api/cron/generate-departures` (daily) tops up the rolling window.
- **Abandoned checkout recovery**: `/api/cron/abandoned-recovery` (every 2 min) emails customers whose
  HELD reservation has contact info but is about to expire unpaid (one email per reservation).
- **Loyalty reward**: `/api/cron/loyalty-reward` (daily) emails a one-time 10%-off promo code to
  customers after their 2nd+ completed tour.
- **Admin** (`/admin`, token-gated): bookings list, revenue, refunds, departure generation, gift vouchers.

## Verification scripts

```bash
npm run seed
npx tsx scripts/verify.ts          # overbooking, live availability, hold expiry
npx tsx scripts/verify-commit.ts   # booking commit + idempotency (webhook's job)
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

- Replace placeholder branding (`src/config/site.ts`, `src/components/Logo.tsx`).
- Replace all images with your own **licensed** photography; rewrite tour copy as original content.
- Add real legal text (privacy, terms), production Stripe keys, a custom domain, and GST handling.
