# Full Customer Journey — Missing Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 6 missing features that complete the customer journey: FAQ page, Private Tour Inquiry, Abandoned Checkout Recovery, Return Customer Loyalty, Booking Reschedule, and Gift Vouchers.

**Architecture:** Each feature is self-contained. Features 3–6 require a single shared schema migration. Features are implemented in dependency order (schema first, then crons, then UI).

**Tech Stack:** Next.js 15 App Router, Prisma + PostgreSQL, Stripe, Resend, Zod, Tailwind CSS.

## Global Constraints

- Money stored as NZD cents (integers), never floats — use `formatNZD()` from `@/lib/money`
- Cron routes must call `cronAuthorized(req)` from `@/lib/cron`
- `export const dynamic = "force-dynamic"` on all API/cron routes
- Emails sent via Resend — guard with `if (!process.env.RESEND_API_KEY)` before sending
- `from` = `process.env.BOOKINGS_FROM_EMAIL || \`${site.name} <onboarding@resend.dev>\``
- `baseUrl` = `process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz"`
- No TypeScript type annotations on function parameters in plain `.ts` files — this codebase uses TypeScript, not JSX files for types but they are fine
- Rate-limit public mutation endpoints with `rateLimit` + `rateLimitKey` from `@/lib/cron` (note: actually from `@/lib/rate-limit`)

---

### Task 1: FAQ Static Data

**Files:**
- Create: `src/data/faq.ts`

- [ ] Create `src/data/faq.ts` with categorised FAQ data:

```ts
export type FaqItem = { q: string; a: string };
export type FaqCategory = { title: string; items: FaqItem[] };

export const faqCategories: FaqCategory[] = [
  {
    title: "Booking & Payment",
    items: [
      { q: "How do I book a tour?", a: "Browse our tours, pick your date and guest count, and complete payment online. You'll receive an instant confirmation email with your booking reference." },
      { q: "What payment methods do you accept?", a: "We accept all major credit and debit cards via Stripe. Payment is processed securely at the time of booking." },
      { q: "Can I pay with a gift voucher?", a: "Yes! Enter your gift voucher code at checkout to apply the balance towards your booking." },
      { q: "Is my booking confirmed immediately?", a: "Yes. Once payment is processed you'll receive an instant confirmation email with your booking reference (KJ-XXXXXX)." },
      { q: "Do you charge booking fees?", a: "No. The price you see is the price you pay — no hidden booking fees." },
    ],
  },
  {
    title: "Cancellations & Changes",
    items: [
      { q: "What is your cancellation policy?", a: "Full refund if cancelled more than 72 hours before departure. 50% refund with 24–72 hours' notice. No refund within 24 hours of departure." },
      { q: "Can I reschedule my booking?", a: "Yes — you can change your tour date up to 48 hours before departure from your account page, subject to availability on the new date." },
      { q: "What if the tour is cancelled due to weather?", a: "Safety is our priority. In the rare event we cancel due to severe weather, you'll receive a full refund or the option to reschedule at no charge." },
      { q: "How do I cancel my booking?", a: "Log in to your account, open your booking, and click 'Request cancellation'. Our team will confirm your refund by email within one business day." },
    ],
  },
  {
    title: "The Tour Experience",
    items: [
      { q: "How many people are on each tour?", a: "Our tours have a maximum of 12–16 guests, keeping the experience intimate and personal." },
      { q: "What should I wear and bring?", a: "Comfortable, layered clothing for the weather, closed-toe shoes, sunscreen, hat, water and snacks, camera, and any personal medications." },
      { q: "Are meals included?", a: "Meals are not included unless stated in the tour description. We stop at excellent local cafés and eateries along the way." },
      { q: "Where does the tour depart from?", a: "Exact pickup locations and meeting points are in your booking confirmation email and your 7-day reminder. Most tours depart from central Christchurch." },
      { q: "Do you offer hotel pickups?", a: "Many tours include hotel pickup in central Christchurch. Add your accommodation in the 'Notes' field at checkout and we'll confirm by email." },
    ],
  },
  {
    title: "Accessibility & Special Requirements",
    items: [
      { q: "Are the tours suitable for children?", a: "Most tours welcome all ages. Check the 'Age Range' field on each tour page for requirements. Children under 5 are generally free of charge — contact us to arrange." },
      { q: "Are the tours wheelchair accessible?", a: "Some tours involve walking on uneven terrain. Please contact us before booking and we'll advise the most suitable option for your needs." },
      { q: "I have dietary requirements — is that ok?", a: "Absolutely. Note your requirements in the 'Special notes' field at checkout and we'll do our best to accommodate you." },
    ],
  },
  {
    title: "Private & Group Tours",
    items: [
      { q: "Can I book a private tour for my group?", a: "Yes! We specialise in bespoke private tours for families, couples, and corporate groups. Use our Private Tour inquiry form to get a tailored quote." },
      { q: "Do you offer group discounts?", a: "Group rates are available for private bookings. Get in touch with your group size and preferred dates for a custom quote." },
      { q: "Can I organise a cruise shore excursion?", a: "Yes — we offer port-timed tours designed to get you ashore, exploring, and back to the ship without stress. See our Cruise Excursions page for details." },
    ],
  },
];
```

- [ ] Commit: `git add src/data/faq.ts && git commit -m "feat: add FAQ static data"`

---

### Task 2: FAQ Page

**Files:**
- Create: `src/app/(public)/faq/page.tsx`

- [ ] Create `src/app/(public)/faq/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { faqCategories } from "@/data/faq";
import { PageHero } from "@/components/PageHero";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers to common questions about booking Kiwi Journeys South Island day tours — cancellations, what to bring, group bookings, accessibility and more.",
  alternates: { canonical: `${SITE_URL}/faq` },
};

export default function FaqPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqCategories.flatMap((cat) =>
      cat.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      }))
    ),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <PageHero
        eyebrow="Help & information"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know before you book."
        image="/images/general/tekapo-church-sunset.jpg"
      />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="space-y-12">
          {faqCategories.map((cat) => (
            <section key={cat.title}>
              <h2 className="font-serif text-2xl font-semibold text-brand-900 mb-6">{cat.title}</h2>
              <div className="space-y-4">
                {cat.items.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-2xl border border-brand-100 bg-white px-6 py-4 shadow-sm"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-brand-800 marker:hidden">
                      {item.q}
                      <span className="shrink-0 text-brand-400 transition-transform group-open:rotate-180">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/70">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center">
          <h3 className="font-serif text-xl font-semibold text-brand-900">Still have questions?</h3>
          <p className="mt-2 text-sm text-foreground/70">Our team typically responds within one business day.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
              Contact us
            </Link>
            <Link href="/private-tours" className="rounded-full border border-brand-200 px-6 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
              Enquire about a private tour
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] Commit: `git add src/app/(public)/faq/page.tsx && git commit -m "feat: FAQ page with accordion and FAQPage schema markup"`

---

### Task 3: Private Tour Inquiry — API

**Files:**
- Create: `src/app/api/contact/private-tour/route.ts`

- [ ] Create `src/app/api/contact/private-tour/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { getSiteSettings } from "@/lib/content";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(50).optional().or(z.literal("")),
  tours: z.array(z.string()).min(1),
  preferredDates: z.string().max(200).optional().or(z.literal("")),
  groupSize: z.number().int().min(1).max(500),
  message: z.string().max(3000).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const { allowed } = rateLimit(rateLimitKey(req, "private-tour"), { limit: 3, windowMs: 60 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const d = parsed.data;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[private-tour] enquiry from", d.email, "(no RESEND_API_KEY)");
    return NextResponse.json({ ok: true });
  }

  const site = await getSiteSettings();
  const resend = new Resend(apiKey);
  const from = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
  const adminEmail = site.email || process.env.ADMIN_EMAIL || "admin@kiwiglobetours.co.nz";

  await Promise.all([
    // Notify admin
    resend.emails.send({
      from,
      to: adminEmail,
      replyTo: d.email,
      subject: `Private tour enquiry — ${d.fullName} (group of ${d.groupSize})`,
      text:
        `New private tour enquiry from ${site.name} website.\n\n` +
        `Name: ${d.fullName}\n` +
        `Email: ${d.email}\n` +
        `Phone: ${d.phone || "not provided"}\n` +
        `Group size: ${d.groupSize}\n` +
        `Tours of interest: ${d.tours.join(", ")}\n` +
        `Preferred dates: ${d.preferredDates || "flexible"}\n` +
        `\nMessage:\n${d.message || "(none)"}\n\n` +
        `Reply directly to this email to respond to the customer.`,
    }),
    // Auto-responder to customer
    resend.emails.send({
      from,
      to: d.email,
      subject: `We've received your private tour enquiry — ${site.name}`,
      text:
        `Hi ${d.fullName},\n\n` +
        `Thank you for your interest in a private tour with ${site.name}!\n\n` +
        `We've received your enquiry for a group of ${d.groupSize} and will be in touch within one business day to discuss dates, itinerary, and pricing.\n\n` +
        `Your enquiry details:\n` +
        `Tours of interest: ${d.tours.join(", ")}\n` +
        `Preferred dates: ${d.preferredDates || "flexible"}\n\n` +
        `In the meantime, feel free to call us at ${site.phone} if you have any urgent questions.\n\n` +
        `We look forward to crafting your perfect New Zealand adventure!\n${site.name}`,
    }),
  ]).catch((e) => console.error("Private tour email failed:", e));

  return NextResponse.json({ ok: true });
}
```

- [ ] Commit: `git add src/app/api/contact/private-tour/route.ts && git commit -m "feat: private tour inquiry API route"`

---

### Task 4: Private Tour Inquiry — Page

**Files:**
- Create: `src/components/PrivateTourForm.tsx`
- Create: `src/app/(public)/private-tours/page.tsx`

- [ ] Create `src/components/PrivateTourForm.tsx`:

```tsx
"use client";

import { useState } from "react";

const TOUR_OPTIONS = [
  "Christchurch City Discovery",
  "Akaroa Scenic Day Tour",
  "Kaikōura Marine Wildlife",
  "Hanmer Springs Thermal Pools",
  "Waipara Valley Wine Tour",
  "Mount Cook Day Tour",
  "Custom / Bespoke Itinerary",
  "Other / Not sure yet",
];

export function PrivateTourForm() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    groupSize: "",
    preferredDates: "",
    message: "",
  });
  const [selectedTours, setSelectedTours] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTour(t: string) {
    setSelectedTours((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  const field = "w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedTours.length === 0) {
      setError("Please select at least one tour of interest.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contact/private-tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          groupSize: Number(form.groupSize) || 1,
          tours: selectedTours,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Could not send enquiry. Please try again.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-8 text-center">
        <p className="text-2xl mb-2">✓</p>
        <h3 className="font-serif text-xl font-semibold text-brand-900">Enquiry received!</h3>
        <p className="mt-2 text-sm text-foreground/70">
          Thank you, {form.fullName}. We'll be in touch within one business day with a personalised quote.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Full name <span className="text-red-500">*</span></label>
          <input className={field} required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Your full name" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Email <span className="text-red-500">*</span></label>
          <input className={field} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Phone</label>
          <input className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 000 0000" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Group size <span className="text-red-500">*</span></label>
          <input className={field} type="number" min="1" max="500" required value={form.groupSize} onChange={(e) => setForm({ ...form, groupSize: e.target.value })} placeholder="e.g. 8" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2">Tours of interest <span className="text-red-500">*</span></label>
        <div className="grid gap-2 sm:grid-cols-2">
          {TOUR_OPTIONS.map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-3 rounded-lg border border-brand-100 bg-brand-50/50 px-4 py-2.5 text-sm transition hover:border-brand-300">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                checked={selectedTours.includes(t)}
                onChange={() => toggleTour(t)}
              />
              {t}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Preferred dates</label>
        <input className={field} value={form.preferredDates} onChange={(e) => setForm({ ...form, preferredDates: e.target.value })} placeholder="e.g. late October, first week of March — flexible on exact dates" />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Tell us more</label>
        <textarea className={field} rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Any special requirements, interests, or questions — the more you share, the better we can tailor your experience." />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "Sending enquiry…" : "Send private tour enquiry"}
      </button>
    </form>
  );
}
```

- [ ] Create `src/app/(public)/private-tours/page.tsx`:

```tsx
import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { PrivateTourForm } from "@/components/PrivateTourForm";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export const metadata: Metadata = {
  title: "Private & Group Tours",
  description: "Book a bespoke private tour of New Zealand's South Island for your group. Custom itineraries, flexible dates, expert local guides. Get a personalised quote.",
  alternates: { canonical: `${SITE_URL}/private-tours` },
  openGraph: { title: "Private & Group Tours — Kiwi Journeys", description: "Craft a bespoke South Island experience for your group.", url: `${SITE_URL}/private-tours` },
};

const WHY = [
  { title: "Your own vehicle & guide", body: "Exclusive use of a comfortable vehicle with a dedicated local guide who knows the hidden gems." },
  { title: "Fully flexible itinerary", body: "We build the day around what you want to see — no compromise, no rushing to suit a group." },
  { title: "Perfect for any occasion", body: "Family reunions, honeymoons, corporate retreats, birthday adventures — we've done them all." },
  { title: "Groups of any size", body: "From an intimate couple to a corporate group of 40+. We'll match the right vehicle and team." },
];

export default function PrivateToursPage() {
  return (
    <>
      <PageHero
        eyebrow="Tailored for you"
        title="Private & Group Tours"
        subtitle="Your own guide, your own pace, your own South Island story."
        image="/images/general/tekapo-church-sunset.jpg"
      />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-brand-900">Request a quote</h2>
            <p className="mt-2 text-sm text-foreground/70">Tell us about your group and we'll be in touch within one business day with a personalised itinerary and pricing.</p>
            <div className="mt-8">
              <PrivateTourForm />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-brand-900">Why go private?</h2>
              <div className="mt-6 space-y-4">
                {WHY.map((w) => (
                  <div key={w.title} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
                    <h3 className="font-semibold text-brand-800">{w.title}</h3>
                    <p className="mt-1 text-sm text-foreground/70">{w.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] Commit: `git add src/components/PrivateTourForm.tsx src/app/(public)/private-tours/page.tsx && git commit -m "feat: private/group tour inquiry page"`

---

### Task 5: Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260627000010_journey_features/migration.sql`

- [ ] Add fields to `prisma/schema.prisma`:

In the `Reservation` model, after `createdAt`:
```prisma
  recoverySentAt        DateTime?
```

In the `Customer` model, after `updatedAt`:
```prisma
  loyaltyEmailSentAt    DateTime?
```

In the `Booking` model, after `createdAt`:
```prisma
  rescheduledFromSessionId String?
  rescheduledAt         DateTime?
```

Add new model at the end of the file:
```prisma
model GiftVoucher {
  id                    String    @id @default(cuid())
  code                  String    @unique
  amountCents           Int
  balanceCents          Int
  purchaserName         String
  purchaserEmail        String
  recipientName         String?
  recipientEmail        String?
  message               String?
  stripePaymentIntentId String?   @unique
  isActive              Boolean   @default(false)
  expiresAt             DateTime?
  createdAt             DateTime  @default(now())

  @@index([code])
  @@index([purchaserEmail])
}
```

- [ ] Create `prisma/migrations/20260627000010_journey_features/migration.sql`:

```sql
-- Abandoned checkout recovery timestamp
ALTER TABLE "Reservation" ADD COLUMN "recoverySentAt" TIMESTAMP(3);

-- Loyalty reward tracking
ALTER TABLE "Customer" ADD COLUMN "loyaltyEmailSentAt" TIMESTAMP(3);

-- Booking reschedule audit trail
ALTER TABLE "Booking" ADD COLUMN "rescheduledFromSessionId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "rescheduledAt" TIMESTAMP(3);

-- Gift vouchers
CREATE TABLE "GiftVoucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "balanceCents" INTEGER NOT NULL,
    "purchaserName" TEXT NOT NULL,
    "purchaserEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "recipientEmail" TEXT,
    "message" TEXT,
    "stripePaymentIntentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GiftVoucher_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GiftVoucher_code_key" ON "GiftVoucher"("code");
CREATE UNIQUE INDEX "GiftVoucher_stripePaymentIntentId_key" ON "GiftVoucher"("stripePaymentIntentId");
CREATE INDEX "GiftVoucher_code_idx" ON "GiftVoucher"("code");
CREATE INDEX "GiftVoucher_purchaserEmail_idx" ON "GiftVoucher"("purchaserEmail");
```

- [ ] Run: `cd /Users/anandumv/Downloads/kiwi-journeys && npx prisma generate`
- [ ] Commit: `git add prisma/ && git commit -m "feat: schema — abandoned recovery, loyalty, reschedule, gift vouchers"`

---

### Task 6: Abandoned Checkout Recovery Cron

**Files:**
- Create: `src/app/api/cron/abandoned-recovery/route.ts`

Logic: Find HELD reservations that (a) have `contactSnapshot` with an email, (b) are ≥8 min old AND expire within the next 5 min, (c) haven't had `recoverySentAt` set. Send one recovery email per reservation. Mark `recoverySentAt`.

- [ ] Create `src/app/api/cron/abandoned-recovery/route.ts`:

```ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/content";
import { cronAuthorized } from "@/lib/cron";

export const dynamic = "force-dynamic";

// Run every 2 minutes. Finds HELD reservations with contact info that are about
// to expire without payment, and sends one recovery email.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const MIN = 60 * 1000;

  // HELD, has contact info (contactSnapshot not null), expires in the next 6 min,
  // created at least 4 min ago (so they had time to see the checkout), not yet recovered.
  const candidates = await prisma.reservation.findMany({
    where: {
      status: "HELD",
      contactSnapshot: { not: null },
      recoverySentAt: null,
      expiresAt: { gte: new Date(now.getTime() + 1 * MIN), lte: new Date(now.getTime() + 6 * MIN) },
      createdAt: { lte: new Date(now.getTime() - 4 * MIN) },
    },
    include: {
      session: { include: { tour: { select: { title: true, slug: true } } } },
    },
  });

  if (candidates.length === 0) return NextResponse.json({ checked: 0, sent: 0 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await prisma.reservation.updateMany({
      where: { id: { in: candidates.map((c) => c.id) } },
      data: { recoverySentAt: now },
    });
    return NextResponse.json({ checked: candidates.length, sent: 0, note: "No RESEND_API_KEY" });
  }

  const resend = new Resend(apiKey);
  const site = await getSiteSettings();
  const from = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";
  let sent = 0;

  for (const r of candidates) {
    const contact = r.contactSnapshot as { fullName?: string; email?: string } | null;
    if (!contact?.email) continue;

    const checkoutUrl = `${baseUrl}/checkout/${r.id}`;
    const firstName = contact.fullName?.split(" ")[0] || "there";

    await resend.emails.send({
      from,
      to: contact.email,
      subject: `Your ${r.session.tour.title} seats are about to be released — ${site.name}`,
      text:
        `Hi ${firstName},\n\n` +
        `You started booking the ${r.session.tour.title} but didn't quite finish.\n\n` +
        `Your seats are about to be released. If you'd still like to join us, you can complete your booking here:\n\n` +
        `${checkoutUrl}\n\n` +
        `If you no longer need these seats, no action is needed — they'll be released automatically.\n\n` +
        `Questions? Reply to this email or call us at ${site.phone}.\n\n` +
        `${site.name}`,
    }).catch((e) => console.error(`Recovery email failed ${r.id}:`, e));

    await prisma.reservation.update({
      where: { id: r.id },
      data: { recoverySentAt: now },
    });
    sent++;
  }

  return NextResponse.json({ checked: candidates.length, sent });
}
```

- [ ] Add cron to `railway.json` — note: Railway crons are configured in Railway dashboard, not in railway.json. The cron endpoint is now available at `/api/cron/abandoned-recovery`. Document the schedule (every 2 minutes) in a comment in the route file (already done above).

- [ ] Commit: `git add src/app/api/cron/abandoned-recovery/route.ts && git commit -m "feat: abandoned checkout recovery cron email"`

---

### Task 7: Return Customer Loyalty Cron

**Files:**
- Create: `src/app/api/cron/loyalty-reward/route.ts`

Logic: Find customers with ≥2 CONFIRMED bookings whose most recent booking was completed 2–4 days ago, no `loyaltyEmailSentAt` set. Create a unique promo code (10% off, 1 use, 60-day expiry), then email it.

- [ ] Create `src/app/api/cron/loyalty-reward/route.ts`:

```ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/content";
import { cronAuthorized } from "@/lib/cron";

export const dynamic = "force-dynamic";

// Run daily. Rewards customers who have just completed their 2nd+ tour
// with a personal 10%-off promo code valid for 60 days.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const D = 24 * 60 * 60 * 1000;

  // Find customers whose most recent CONFIRMED tour ended 2–4 days ago
  // (enough time to recover), who have 2+ confirmed bookings total, and who
  // haven't yet received a loyalty reward email.
  const recentlyFinished = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      session: {
        startsAtUtc: { gte: new Date(now.getTime() - 4 * D), lt: new Date(now.getTime() - 2 * D) },
      },
    },
    select: { customerId: true },
    distinct: ["customerId"],
  });

  if (recentlyFinished.length === 0) return NextResponse.json({ rewarded: 0 });

  const customerIds = recentlyFinished.map((b) => b.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds }, loyaltyEmailSentAt: null },
    select: { id: true, fullName: true, email: true, _count: { select: { bookings: true } } },
  });

  // Only customers with 2+ total bookings qualify.
  const eligible = customers.filter((c) => c._count.bookings >= 2);
  if (eligible.length === 0) return NextResponse.json({ rewarded: 0, note: "none qualified" });

  const apiKey = process.env.RESEND_API_KEY;
  const resend = apiKey ? new Resend(apiKey) : null;
  const site = await getSiteSettings();
  const from = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

  let rewarded = 0;
  const expiresAt = new Date(now.getTime() + 60 * D);

  for (const customer of eligible) {
    // Create a unique promo code: RETURN + 6 random chars
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    const code = `RETURN${suffix}`;

    await prisma.$transaction(async (tx) => {
      await tx.promoCode.create({
        data: {
          code,
          description: `Loyalty reward for returning guest ${customer.email}`,
          type: "percentage",
          value: 10,
          maxUses: 1,
          expiresAt,
          isActive: true,
        },
      });
      await tx.customer.update({
        where: { id: customer.id },
        data: { loyaltyEmailSentAt: now },
      });
    });

    if (resend) {
      await resend.emails.send({
        from,
        to: customer.email,
        subject: `A little thank-you from ${site.name} — 10% off your next adventure`,
        text:
          `Hi ${customer.fullName.split(" ")[0]},\n\n` +
          `Thank you for adventuring with us again — it means a great deal.\n\n` +
          `As a returning guest, here's a personal 10% discount for your next booking:\n\n` +
          `  Promo code: ${code}\n` +
          `  Valid until: ${expiresAt.toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}\n\n` +
          `Enter the code at checkout on any of our South Island day tours:\n` +
          `${baseUrl}/tours\n\n` +
          `We hope to see you on the road again soon!\n${site.name}\n${site.phone}`,
      }).catch((e) => console.error(`Loyalty email failed ${customer.email}:`, e));
    } else {
      console.log(`[loyalty] (no RESEND_API_KEY) code ${code} for ${customer.email}`);
    }

    rewarded++;
  }

  return NextResponse.json({ eligible: eligible.length, rewarded });
}
```

- [ ] Commit: `git add src/app/api/cron/loyalty-reward/route.ts && git commit -m "feat: return customer loyalty reward cron"`

---

### Task 8: Booking Reschedule — API

**Files:**
- Create: `src/app/api/account/bookings/[ref]/reschedule/route.ts`

Rules: booking must be CONFIRMED, not past, > 48h before departure. New session must be same tour, SCHEDULED, future, have enough seats. No price change (keep same total). Email admin and customer.

- [ ] Create `src/app/api/account/bookings/[ref]/reschedule/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customerAuth";
import { remainingForSessions } from "@/lib/availability";
import { Resend } from "resend";
import { getSiteSettings } from "@/lib/content";
import { dateLabel, timeLabel } from "@/lib/time";

export const dynamic = "force-dynamic";

const schema = z.object({ newSessionId: z.string().min(1) });

export async function POST(req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const session = await getCurrentCustomer();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { newSessionId } = parsed.data;
  const now = new Date();

  const booking = await prisma.booking.findFirst({
    where: { reference: ref, customer: { email: session.email } },
    include: {
      session: { include: { tour: { select: { id: true, title: true, slug: true } } } },
      customer: { select: { fullName: true, email: true } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "CONFIRMED") return NextResponse.json({ error: "Only confirmed bookings can be rescheduled." }, { status: 409 });

  const hoursUntil = (booking.session.startsAtUtc.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntil < 48) {
    return NextResponse.json({ error: "Rescheduling closes 48 hours before departure." }, { status: 409 });
  }

  const newSession = await prisma.session.findUnique({
    where: { id: newSessionId },
    include: { tour: { select: { id: true, title: true } } },
  });
  if (!newSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (newSession.tourId !== booking.session.tourId) {
    return NextResponse.json({ error: "Cannot reschedule to a different tour." }, { status: 400 });
  }
  if (newSession.status !== "SCHEDULED" || newSession.startsAtUtc <= now) {
    return NextResponse.json({ error: "That departure is no longer available." }, { status: 409 });
  }
  if (newSessionId === booking.sessionId) {
    return NextResponse.json({ error: "That is already your current departure date." }, { status: 400 });
  }

  const remaining = await remainingForSessions([newSessionId], now);
  const seats = remaining.get(newSessionId) ?? 0;
  if (seats < booking.seats) {
    return NextResponse.json({ error: `Only ${seats} seat${seats === 1 ? "" : "s"} available on that date.` }, { status: 409 });
  }

  const oldSessionId = booking.sessionId;
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      sessionId: newSessionId,
      rescheduledFromSessionId: oldSessionId,
      rescheduledAt: now,
    },
  });

  // Notify customer and admin.
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    const site = await getSiteSettings();
    const from = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
    const adminEmail = site.email || process.env.ADMIN_EMAIL || "admin@kiwiglobetours.co.nz";

    await Promise.all([
      resend.emails.send({
        from,
        to: booking.customer.email,
        subject: `Booking rescheduled: ${booking.session.tour.title} (${booking.reference})`,
        text:
          `Hi ${booking.customer.fullName.split(" ")[0]},\n\n` +
          `Your booking has been rescheduled.\n\n` +
          `Tour: ${booking.session.tour.title}\n` +
          `New date: ${dateLabel(newSession.startsAtUtc)}\n` +
          `New departure: ${timeLabel(newSession.startsAtUtc)} (NZ time)\n` +
          `Reference: ${booking.reference}\n\n` +
          `If you didn't request this change, please contact us immediately at ${site.phone}.\n\n` +
          `${site.name}`,
      }),
      resend.emails.send({
        from,
        to: adminEmail,
        subject: `Booking rescheduled — ${booking.reference}`,
        text:
          `Customer rescheduled a booking.\n\n` +
          `Reference: ${booking.reference}\n` +
          `Customer: ${booking.customer.fullName} (${booking.customer.email})\n` +
          `Tour: ${booking.session.tour.title}\n` +
          `Old session ID: ${oldSessionId}\n` +
          `New date: ${dateLabel(newSession.startsAtUtc)} ${timeLabel(newSession.startsAtUtc)}\n`,
      }),
    ]).catch((e) => console.error("Reschedule email failed:", e));
  }

  return NextResponse.json({
    ok: true,
    newDate: dateLabel(newSession.startsAtUtc),
    newTime: timeLabel(newSession.startsAtUtc),
  });
}
```

- [ ] Commit: `git add src/app/api/account/bookings/[ref]/reschedule/route.ts && git commit -m "feat: booking reschedule API"`

---

### Task 9: Booking Reschedule — UI

**Files:**
- Create: `src/components/account/RescheduleForm.tsx`
- Modify: `src/app/(public)/account/bookings/[reference]/page.tsx`

- [ ] Create `src/components/account/RescheduleForm.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Session = {
  sessionId: string;
  startsAtUtc: string;
  remaining: number;
};

type DayAvailability = {
  date: string;
  sessions: Session[];
  remaining: number;
};

export function RescheduleForm({
  reference,
  tourSlug,
  seats,
}: {
  reference: string;
  tourSlug: string;
  seats: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setDays([]);
    setSelectedSessionId(null);
    fetch(`/api/tours/${tourSlug}/availability?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        const available = (data.days ?? []).filter((d: DayAvailability) => d.remaining >= seats);
        setDays(available);
      })
      .catch(() => setError("Could not load availability."))
      .finally(() => setLoading(false));
  }, [open, year, month, tourSlug, seats]);

  async function confirm() {
    if (!selectedSessionId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/bookings/${reference}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSessionId: selectedSessionId }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Could not reschedule. Please try again.");
      } else {
        setDone(true);
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const today = new Date();

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }
  const canGoPrev = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1);

  if (done) {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
        Booking rescheduled! Your confirmation email is on its way.
      </div>
    );
  }

  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-sm text-brand-600 underline hover:text-brand-800">
          Change date
        </button>
      ) : (
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 space-y-4">
          <p className="text-sm font-medium text-brand-900">Choose a new departure date</p>

          <div className="flex items-center justify-between">
            <button onClick={prevMonth} disabled={!canGoPrev} className="px-2 py-1 text-sm text-brand-600 disabled:opacity-30 hover:underline">← Prev</button>
            <span className="text-sm font-semibold text-brand-800">{MONTHS[month - 1]} {year}</span>
            <button onClick={nextMonth} className="px-2 py-1 text-sm text-brand-600 hover:underline">Next →</button>
          </div>

          {loading && <p className="text-xs text-foreground/50">Loading availability…</p>}

          {!loading && days.length === 0 && (
            <p className="text-xs text-foreground/50">No available dates this month with {seats} seat{seats > 1 ? "s" : ""}.</p>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {days.map((day) =>
              day.sessions.map((s) => {
                const dt = new Date(s.startsAtUtc);
                const label = dt.toLocaleDateString("en-NZ", { weekday: "short", day: "numeric", month: "short" });
                const time = dt.toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit", timeZone: "Pacific/Auckland" });
                const sel = selectedSessionId === s.sessionId;
                return (
                  <button
                    key={s.sessionId}
                    onClick={() => setSelectedSessionId(s.sessionId)}
                    className={`w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition ${sel ? "border-brand-500 bg-brand-50 font-medium text-brand-700" : "border-brand-100 bg-white hover:border-brand-300"}`}
                  >
                    <span>{label} — {time}</span>
                    <span className="text-xs text-foreground/50">{s.remaining} left</span>
                  </button>
                );
              })
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={confirm}
              disabled={!selectedSessionId || submitting}
              className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Rescheduling…" : "Confirm new date"}
            </button>
            <button onClick={() => setOpen(false)} className="text-sm text-foreground/50 hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] Modify `src/app/(public)/account/bookings/[reference]/page.tsx` — add reschedule after notes block. After line 8 (imports), add:
```tsx
import { RescheduleForm } from "@/components/account/RescheduleForm";
```

After the `canCancel` const (line ~42), add:
```tsx
  const canReschedule = !isPast && booking.status === "CONFIRMED" && hoursUntilDeparture >= 48;
```

In the JSX, inside the second card div (after `UpdateNotesForm`), add before the `{canCancel && ...}` block:
```tsx
        {canReschedule && (
          <div className="border-t border-brand-50 pt-5">
            <p className="text-sm font-medium text-brand-800 mb-2">Change your date</p>
            <p className="text-xs text-foreground/50 mb-3">Reschedule to any available date for the same tour.</p>
            <RescheduleForm
              reference={booking.reference}
              tourSlug={booking.session.tour.slug}
              seats={booking.seats}
            />
          </div>
        )}
```

- [ ] Commit: `git add src/components/account/RescheduleForm.tsx src/app/(public)/account/bookings/[reference]/page.tsx && git commit -m "feat: booking reschedule UI"`

---

### Task 10: Gift Voucher — Purchase API + Stripe Webhook

**Files:**
- Create: `src/app/api/gift-vouchers/route.ts`
- Create: `src/app/api/gift-vouchers/validate/route.ts`
- Modify: `src/app/api/stripe/webhook/route.ts`

Gift voucher code format: `GV-XXXXXXXX` (8 random alphanumeric chars, uppercase, no ambiguous chars).

- [ ] Create `src/app/api/gift-vouchers/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSiteSettings } from "@/lib/content";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeVoucherCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `GV-${s}`;
}

const schema = z.object({
  amountCents: z.number().int().min(5000).max(200000), // $50–$2000 NZD
  purchaserName: z.string().min(1).max(200),
  purchaserEmail: z.string().email(),
  recipientName: z.string().max(200).optional().or(z.literal("")),
  recipientEmail: z.string().email().optional().or(z.literal("")),
  message: z.string().max(500).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const { allowed } = rateLimit(rateLimitKey(req, "gift-voucher"), { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const d = parsed.data;
  const code = makeVoucherCode();

  const voucher = await prisma.giftVoucher.create({
    data: {
      code,
      amountCents: d.amountCents,
      balanceCents: d.amountCents,
      purchaserName: d.purchaserName,
      purchaserEmail: d.purchaserEmail,
      recipientName: d.recipientName || null,
      recipientEmail: d.recipientEmail || null,
      message: d.message || null,
      isActive: false,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  if (!isStripeConfigured()) {
    return NextResponse.json({ voucherId: voucher.id, clientSecret: null, stripeConfigured: false });
  }

  try {
    const stripe = getStripe();
    const site = await getSiteSettings();
    const pi = await stripe.paymentIntents.create({
      amount: d.amountCents,
      currency: "nzd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        giftVoucher: "true",
        giftVoucherId: voucher.id,
        voucherCode: code,
      },
      description: `${site.name} — Gift Voucher ${code}`,
    });

    await prisma.giftVoucher.update({
      where: { id: voucher.id },
      data: { stripePaymentIntentId: pi.id },
    });

    return NextResponse.json({
      voucherId: voucher.id,
      voucherCode: code,
      clientSecret: pi.client_secret,
      stripeConfigured: true,
    });
  } catch (e) {
    console.error("Gift voucher Stripe PI failed:", e);
    await prisma.giftVoucher.delete({ where: { id: voucher.id } });
    return NextResponse.json({ error: "Payment setup failed" }, { status: 502 });
  }
}
```

- [ ] Create `src/app/api/gift-vouchers/validate/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { allowed } = rateLimit(rateLimitKey(req, "gv-validate"), { limit: 10, windowMs: 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "").trim().toUpperCase();
  const totalCents: number = Number(body.totalCents) || 0;

  if (!code) return NextResponse.json({ valid: false, message: "No code provided." }, { status: 400 });

  const voucher = await prisma.giftVoucher.findUnique({ where: { code } });

  if (!voucher || !voucher.isActive) {
    return NextResponse.json({ valid: false, message: "Invalid or inactive gift voucher." });
  }
  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, message: "This gift voucher has expired." });
  }
  if (voucher.balanceCents <= 0) {
    return NextResponse.json({ valid: false, message: "This gift voucher has no remaining balance." });
  }

  // Discount is the lesser of the voucher balance and the booking total.
  // Keep at least 100 cents (NZD $1) charged via Stripe — zero-charge flow not supported.
  const maxDiscount = Math.max(0, totalCents - 100);
  const discountCents = Math.min(voucher.balanceCents, maxDiscount);

  const balanceNZD = (voucher.balanceCents / 100).toFixed(2);
  return NextResponse.json({
    valid: true,
    voucherId: voucher.id,
    voucherCode: voucher.code,
    balanceCents: voucher.balanceCents,
    discountCents,
    message: `Gift voucher applied — NZD ${(discountCents / 100).toFixed(2)} off (balance remaining: NZD ${balanceNZD})`,
  });
}
```

- [ ] Modify `src/app/api/stripe/webhook/route.ts` — add gift voucher activation inside the `payment_intent.succeeded` case:

In the `payment_intent.succeeded` case, after the `if (reservationId)` block, add:

```ts
        const giftVoucherId = pi.metadata?.giftVoucherId;
        if (giftVoucherId && pi.metadata?.giftVoucher === "true") {
          await activateGiftVoucher(giftVoucherId, pi.id);
        }
```

Add this function at the bottom of the file (before the final export):

```ts
async function activateGiftVoucher(voucherId: string, paymentIntentId: string) {
  const voucher = await prisma.giftVoucher.findUnique({ where: { id: voucherId } });
  if (!voucher || voucher.isActive) return; // idempotent

  await prisma.giftVoucher.update({
    where: { id: voucherId },
    data: { isActive: true },
  });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const site = await getSiteSettings();
  const from = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";
  const expiryStr = voucher.expiresAt
    ? voucher.expiresAt.toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })
    : "no expiry";

  // Email purchaser
  await resend.emails.send({
    from,
    to: voucher.purchaserEmail,
    subject: `Your ${site.name} gift voucher is ready! (${voucher.code})`,
    text:
      `Hi ${voucher.purchaserName.split(" ")[0]},\n\n` +
      `Your gift voucher has been activated!\n\n` +
      `  Code: ${voucher.code}\n` +
      `  Value: NZD ${(voucher.amountCents / 100).toFixed(2)}\n` +
      `  Valid until: ${expiryStr}\n\n` +
      (voucher.recipientName ? `  For: ${voucher.recipientName}\n\n` : "") +
      `The recipient can enter this code at checkout when booking any ${site.name} tour:\n` +
      `${baseUrl}/tours\n\n` +
      `Thank you for choosing ${site.name}!\n${site.phone}`,
  }).catch((e) => console.error("Gift voucher purchaser email failed:", e));

  // Email recipient if different from purchaser
  if (voucher.recipientEmail && voucher.recipientEmail !== voucher.purchaserEmail) {
    await resend.emails.send({
      from,
      to: voucher.recipientEmail,
      subject: `You've received a ${site.name} gift voucher!`,
      text:
        `Hi ${voucher.recipientName || "there"},\n\n` +
        `${voucher.purchaserName} has sent you a gift voucher for a New Zealand South Island adventure!\n\n` +
        (voucher.message ? `"${voucher.message}"\n\n` : "") +
        `  Gift voucher code: ${voucher.code}\n` +
        `  Value: NZD ${(voucher.amountCents / 100).toFixed(2)}\n` +
        `  Valid until: ${expiryStr}\n\n` +
        `Use this code at checkout when booking any tour:\n` +
        `${baseUrl}/tours\n\n` +
        `We can't wait to show you New Zealand!\n${site.name}`,
    }).catch((e) => console.error("Gift voucher recipient email failed:", e));
  }
}
```

Also add the imports `Resend` and `getSiteSettings` to the webhook file if not already present.

- [ ] Commit: `git add src/app/api/gift-vouchers/ src/app/api/stripe/webhook/route.ts && git commit -m "feat: gift voucher purchase API + Stripe webhook activation"`

---

### Task 11: Gift Voucher — Checkout Integration

**Files:**
- Modify: `src/components/CheckoutForm.tsx`
- Modify: `src/app/api/reservations/[id]/contact/route.ts`
- Modify: `src/lib/booking.ts`

The checkout already has a promo code section. Add a gift voucher section below it. On contact submit, if a gift voucher code is provided, update the Stripe PI amount to the net total.

- [ ] Modify `src/components/CheckoutForm.tsx`:

Add gift voucher state after the promo state (after `const [applyingPromo, setApplyingPromo] = useState(false);`):

```tsx
  const [giftVoucherCode, setGiftVoucherCode] = useState("");
  type VoucherResult = { valid: boolean; voucherId?: string; voucherCode?: string; discountCents?: number; message: string };
  const [voucherResult, setVoucherResult] = useState<VoucherResult | null>(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);
```

Add the `applyVoucher` function after `applyPromo`:

```tsx
  async function applyVoucher() {
    if (!giftVoucherCode.trim()) return;
    setApplyingVoucher(true);
    setVoucherResult(null);
    try {
      const res = await fetch("/api/gift-vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftVoucherCode.trim(), totalCents }),
      });
      const data = await res.json();
      setVoucherResult(data);
    } catch {
      setVoucherResult({ valid: false, message: "Could not apply voucher. Try again." });
    } finally {
      setApplyingVoucher(false);
    }
  }
```

Update the `onSubmit` body passed to the contact endpoint — add `giftVoucherCode` field:

```tsx
        body: JSON.stringify({
          ...contact,
          marketingConsent,
          promoCodeId: promoResult?.valid ? promoResult.promoId : undefined,
          giftVoucherCode: voucherResult?.valid ? voucherResult.voucherCode : undefined,
          giftVoucherDiscountCents: voucherResult?.valid ? (voucherResult.discountCents ?? 0) : 0,
        }),
```

Update the discount calculation to include both promo and voucher:

```tsx
  const promoDiscount = promoResult?.valid ? (promoResult.discountCents ?? 0) : 0;
  const voucherDiscount = voucherResult?.valid ? (voucherResult.discountCents ?? 0) : 0;
  const discountCents = promoDiscount + voucherDiscount;
  const finalCents = Math.max(100, totalCents - discountCents); // min $1 NZD
```

Add the gift voucher UI section in JSX, after the promo code `</div>` section:

```tsx
      <div>
        <h2 className="text-lg font-semibold text-brand-900">Gift voucher</h2>
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            placeholder="GV-XXXXXXXX"
            value={giftVoucherCode}
            onChange={(e) => { setGiftVoucherCode(e.target.value.toUpperCase()); setVoucherResult(null); }}
          />
          <button
            type="button"
            onClick={applyVoucher}
            disabled={applyingVoucher || !giftVoucherCode.trim()}
            className="rounded-lg border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
          >
            {applyingVoucher ? "…" : "Apply"}
          </button>
        </div>
        {voucherResult && (
          <p className={`mt-2 text-sm ${voucherResult.valid ? "text-teal-700" : "text-red-600"}`}>
            {voucherResult.message}
          </p>
        )}
      </div>
```

- [ ] Modify `src/app/api/reservations/[id]/contact/route.ts` — add `giftVoucherCode` and `giftVoucherDiscountCents` fields to the schema and handle the PI update:

Add to the zod schema:
```ts
  giftVoucherCode: z.string().optional(),
  giftVoucherDiscountCents: z.number().int().min(0).optional().default(0),
```

After saving the contactSnapshot, add the PI amount update logic:

```ts
  // If a gift voucher was applied, update the Stripe PaymentIntent amount to the net total.
  const voucherDiscount = parsed.data.giftVoucherDiscountCents ?? 0;
  if (voucherDiscount > 0 && reservation2.stripePaymentIntentId) {
    const { getStripe, isStripeConfigured } = await import("@/lib/stripe");
    if (isStripeConfigured()) {
      const netCents = Math.max(100, reservation2.totalCents - voucherDiscount);
      try {
        await getStripe().paymentIntents.update(reservation2.stripePaymentIntentId, { amount: netCents });
      } catch (e) {
        console.error("Failed to update PI amount for gift voucher:", e);
      }
    }
  }
```

(Note: need to fetch `reservation2` = the reservation with `totalCents` and `stripePaymentIntentId` after updating. Adjust the existing fetch to include these fields.)

- [ ] Modify `src/lib/booking.ts` — in `commitReservation`, after creating the booking in the transaction, add gift voucher balance deduction:

Inside the `prisma.$transaction` callback, after `tx.reservation.update(...)`, add:

```ts
    // Deduct gift voucher balance if one was applied.
    const contact2 = (reservation.contactSnapshot as unknown as Contact | null);
    if (contact2?.giftVoucherCode) {
      const deduction = Math.min(
        reservation.totalCents,
        (contact2 as { giftVoucherDiscountCents?: number }).giftVoucherDiscountCents ?? 0,
      );
      if (deduction > 0) {
        await tx.giftVoucher.updateMany({
          where: { code: contact2.giftVoucherCode, isActive: true, balanceCents: { gte: deduction } },
          data: { balanceCents: { decrement: deduction } },
        });
      }
    }
```

- [ ] Commit: `git add src/components/CheckoutForm.tsx src/app/api/reservations/[id]/contact/route.ts src/lib/booking.ts && git commit -m "feat: gift voucher checkout integration"`

---

### Task 12: Gift Voucher — Purchase Page

**Files:**
- Create: `src/components/GiftVoucherForm.tsx`
- Create: `src/app/(public)/gift-vouchers/page.tsx`
- Create: `src/app/(public)/gift-vouchers/success/page.tsx`

- [ ] Create `src/components/GiftVoucherForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { formatNZD } from "@/lib/money";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: Promise<Stripe | null> | null = null;
function getStripePromise() {
  if (!stripePromise && pk && pk !== "pk_test_xxx") stripePromise = loadStripe(pk);
  return stripePromise;
}

const PRESET_AMOUNTS = [5000, 10000, 15000, 20000]; // $50, $100, $150, $200 NZD cents

function GiftVoucherInner({ amountCents, purchaserName }: { amountCents: number; purchaserName: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error: payErr } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/gift-vouchers/success`,
        receipt_email: "",
      },
    });
    if (payErr) {
      setError(payErr.message || "Payment failed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
        <p className="text-sm text-foreground/70">
          Paying <strong className="text-brand-800">{formatNZD(amountCents)} NZD</strong> for a gift voucher addressed to {purchaserName}.
        </p>
      </div>
      <div className="rounded-xl border border-brand-100 p-4">
        <PaymentElement />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "Processing…" : `Pay ${formatNZD(amountCents)}`}
      </button>
    </form>
  );
}

export function GiftVoucherForm({ stripeReady }: { stripeReady: boolean }) {
  const [step, setStep] = useState<"details" | "payment">("details");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [form, setForm] = useState({
    purchaserName: "",
    purchaserEmail: "",
    recipientName: "",
    recipientEmail: "",
    message: "",
    customAmount: "",
  });
  const [selectedPreset, setSelectedPreset] = useState<number | null>(10000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountCents = selectedPreset ?? (Number(form.customAmount) * 100 || 0);
  const field = "w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none";

  async function proceedToPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!form.purchaserName || !form.purchaserEmail) {
      setError("Please enter your name and email.");
      return;
    }
    if (amountCents < 5000) {
      setError("Minimum voucher value is NZD $50.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/gift-vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          purchaserName: form.purchaserName,
          purchaserEmail: form.purchaserEmail,
          recipientName: form.recipientName || undefined,
          recipientEmail: form.recipientEmail || undefined,
          message: form.message || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Could not set up payment. Please try again.");
        return;
      }
      if (!d.stripeConfigured) {
        setError("Payments are not configured. Please contact us to purchase a gift voucher.");
        return;
      }
      setClientSecret(d.clientSecret);
      setStep("payment");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "payment" && clientSecret) {
    const promise = getStripePromise();
    return (
      <Elements stripe={promise} options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#137264" } } }}>
        <GiftVoucherInner amountCents={amountCents} purchaserName={form.purchaserName} />
      </Elements>
    );
  }

  return (
    <form onSubmit={proceedToPayment} className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-3">Voucher value</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESET_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => { setSelectedPreset(a); setForm({ ...form, customAmount: "" }); }}
              className={`rounded-xl border py-3 text-sm font-semibold transition ${selectedPreset === a ? "border-brand-500 bg-brand-50 text-brand-700" : "border-brand-100 hover:border-brand-300"}`}
            >
              {formatNZD(a)}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-foreground/50">or enter custom:</span>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-sm text-foreground/50">NZD $</span>
            <input
              type="number"
              min="50"
              max="2000"
              step="1"
              className="w-28 rounded-lg border border-brand-200 pl-14 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              placeholder="e.g. 75"
              value={form.customAmount}
              onChange={(e) => { setForm({ ...form, customAmount: e.target.value }); setSelectedPreset(null); }}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-3">Your details</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={field} required placeholder="Your full name" value={form.purchaserName} onChange={(e) => setForm({ ...form, purchaserName: e.target.value })} />
          <input className={field} type="email" required placeholder="Your email" value={form.purchaserEmail} onChange={(e) => setForm({ ...form, purchaserEmail: e.target.value })} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-3">Recipient (optional)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={field} placeholder="Recipient's name" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
          <input className={field} type="email" placeholder="Recipient's email (to send them the code)" value={form.recipientEmail} onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })} />
        </div>
        <textarea className={`${field} mt-3`} rows={2} placeholder="Personal message (optional)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || amountCents < 5000}
        className="w-full rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "Setting up…" : `Continue to payment — ${amountCents >= 5000 ? formatNZD(amountCents) : "NZD $50 min"}`}
      </button>
    </form>
  );
}
```

- [ ] Create `src/app/(public)/gift-vouchers/page.tsx`:

```tsx
import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { GiftVoucherForm } from "@/components/GiftVoucherForm";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";
const stripeReady = !!(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY !== "pk_test_xxx"
);

export const metadata: Metadata = {
  title: "Gift Vouchers",
  description: "Give the gift of a New Zealand South Island adventure. Kiwi Journeys gift vouchers are valid for one year and redeemable on any tour.",
  alternates: { canonical: `${SITE_URL}/gift-vouchers` },
  openGraph: { title: "Gift Vouchers — Kiwi Journeys", description: "Give the gift of a New Zealand adventure.", url: `${SITE_URL}/gift-vouchers` },
};

const FEATURES = [
  { title: "Valid for 1 year", body: "Recipients have a full year to choose their perfect adventure." },
  { title: "Redeemable on any tour", body: "Use on any Kiwi Journeys day tour — full or partial balance." },
  { title: "Instant digital delivery", body: "Voucher code emailed instantly after purchase. No waiting." },
  { title: "Any amount from $50", body: "Choose a preset or enter your own custom amount." },
];

export default function GiftVouchersPage() {
  return (
    <>
      <PageHero
        eyebrow="Give the gift of adventure"
        title="Gift Vouchers"
        subtitle="The perfect present for anyone who loves to explore New Zealand."
        image="/images/general/tekapo-church-sunset.jpg"
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-brand-900">Purchase a voucher</h2>
            <p className="mt-2 text-sm text-foreground/70">The code is emailed instantly after payment.</p>
            <div className="mt-8">
              <GiftVoucherForm stripeReady={stripeReady} />
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="font-serif text-3xl font-semibold text-brand-900">How it works</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-brand-800">{f.title}</h3>
                  <p className="mt-1 text-sm text-foreground/70">{f.body}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6">
              <h3 className="font-semibold text-brand-800">How to redeem</h3>
              <ol className="mt-3 space-y-2 text-sm text-foreground/70 list-decimal list-inside">
                <li>Browse and choose your tour at kiwiglobetours.co.nz/tours</li>
                <li>Select your date and guests, proceed to checkout</li>
                <li>Enter your gift voucher code in the <strong>Gift voucher</strong> field</li>
                <li>The value is deducted from your total automatically</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] Create `src/app/(public)/gift-vouchers/success/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Gift Voucher purchased!" };

export default function GiftVoucherSuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <div className="text-5xl mb-4">🎁</div>
      <h1 className="font-serif text-3xl font-semibold text-brand-900">Your gift voucher is on its way!</h1>
      <p className="mt-4 text-foreground/70">
        The voucher code has been sent to your email. If you provided a recipient email, they'll receive the gift message too.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/tours" className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
          Browse tours
        </Link>
        <Link href="/" className="rounded-full border border-brand-200 px-6 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
          Back to home
        </Link>
      </div>
    </div>
  );
}
```

- [ ] Commit all gift voucher UI files

---

### Task 13: Admin Gift Voucher Page

**Files:**
- Create: `src/app/admin/gift-vouchers/page.tsx`

- [ ] Create `src/app/admin/gift-vouchers/page.tsx`:

```tsx
import { prisma } from "@/lib/db";
import { formatNZD } from "@/lib/money";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gift Vouchers — Admin" };

export default async function AdminGiftVouchersPage() {
  const vouchers = await prisma.giftVoucher.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-900">Gift Vouchers</h1>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-brand-100 bg-brand-50 text-left text-xs font-semibold uppercase tracking-wider text-foreground/50">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Purchaser</th>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Purchased</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {vouchers.map((v) => (
              <tr key={v.id} className="hover:bg-brand-50/40">
                <td className="px-4 py-3 font-mono font-semibold text-brand-700">{v.code}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${v.isActive ? "bg-teal-100 text-teal-800" : "bg-amber-100 text-amber-800"}`}>
                    {v.isActive ? (v.balanceCents <= 0 ? "Used" : "Active") : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-3">{formatNZD(v.amountCents)}</td>
                <td className="px-4 py-3 font-medium">{formatNZD(v.balanceCents)}</td>
                <td className="px-4 py-3">
                  <div>{v.purchaserName}</div>
                  <div className="text-xs text-foreground/50">{v.purchaserEmail}</div>
                </td>
                <td className="px-4 py-3">
                  {v.recipientName ? (
                    <>
                      <div>{v.recipientName}</div>
                      <div className="text-xs text-foreground/50">{v.recipientEmail}</div>
                    </>
                  ) : <span className="text-foreground/30">—</span>}
                </td>
                <td className="px-4 py-3 text-foreground/60">
                  {v.expiresAt ? v.expiresAt.toLocaleDateString("en-NZ") : "—"}
                </td>
                <td className="px-4 py-3 text-foreground/60">
                  {v.createdAt.toLocaleDateString("en-NZ")}
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-foreground/40">No gift vouchers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] Commit: `git add src/app/admin/gift-vouchers/page.tsx && git commit -m "feat: admin gift vouchers list page"`

---

### Task 14: Final Polish — Navigation Links

**Files:**
- Modify: `src/components/Footer.tsx` (add FAQ + Gift Vouchers + Private Tours links)
- Modify: `src/components/Header.tsx` (if needed)

- [ ] In `src/components/Footer.tsx`, find the links section and add FAQ, Gift Vouchers, and Private Tours to the appropriate nav columns. The exact lines depend on the current footer structure — read the file first and insert into the "Explore" or "Company" column:
  - `/faq` — FAQ
  - `/gift-vouchers` — Gift Vouchers
  - `/private-tours` — Private Tours

- [ ] Commit: `git add src/components/Footer.tsx && git commit -m "feat: add FAQ, gift vouchers, private tours to footer nav"`

---

### Task 15: Build Verification

- [ ] Run `npx tsc --noEmit` from project root — fix any type errors
- [ ] Run `npm run build` — confirm clean build
- [ ] Commit any fixes: `git commit -m "fix: build errors"`
