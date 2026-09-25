import { randomUUID } from "node:crypto";
import { Prisma, type EmailJob } from "@prisma/client";
import { Resend } from "resend";
import { prisma } from "./db";
import { getSiteSettings } from "./content";
import { formatNZD, gstSummary } from "./money";
import { dateLabel, timeLabel } from "./time";

export async function enqueueBookingEmails(tx: Prisma.TransactionClient, args: {
  reference: string; to: string; customerName: string; tourTitle: string;
  startsAtUtc: Date; totalCents: number; seats: number;
}) {
  const site = await getSiteSettings();
  const sender = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
  // Prices are GST-inclusive, so this breaks the total down rather than adding
  // to it. Omitted entirely when GST_NUMBER is unset: without a GST number this
  // is a receipt, not taxable supply information, and must not read as one.
  const gst = gstSummary(args.totalCents);
  const gstLines = gst
    ? `Subtotal (excl. GST): ${formatNZD(gst.exGstCents)} NZD\nGST (15%): ${formatNZD(gst.gstCents)} NZD\nGST number: ${gst.number}\n`
    : "";
  const details = `Reference: ${args.reference}\nTour: ${args.tourTitle}\nDate: ${dateLabel(args.startsAtUtc)} at ${timeLabel(args.startsAtUtc)} (NZ time)\nGuests: ${args.seats}\nTotal paid: ${formatNZD(args.totalCents)} NZD\n${gstLines}`;
  await tx.emailJob.createMany({ data: [
    { id: `booking-${args.reference}-customer`, bookingReference: args.reference,
      recipient: args.to, sender, subject: `Booking confirmed: ${args.tourTitle} (${args.reference})`,
      body: `Thank you for booking with ${site.name}!\n\n${details}\nQuestions? ${site.phone}\n${site.name}` },
    { id: `booking-${args.reference}-admin`, bookingReference: args.reference,
      recipient: site.email || process.env.ADMIN_EMAIL || "admin@kiwiglobetours.co.nz", sender,
      subject: `New booking: ${args.tourTitle} (${args.reference})`,
      body: `${details}\nCustomer: ${args.customerName} (${args.to})` },
  ] });
}

export type OutboundEmail = { to: string; subject: string; body: string; bookingReference: string };

/**
 * Queue one-off notification emails (reschedule confirmations, cancellation
 * requests) for durable delivery.
 *
 * Sending these straight through Resend meant a provider blip lost the message
 * with nothing to retry from — the customer was told nothing and no record
 * survived. Ids carry a random suffix because, unlike booking confirmations,
 * the same booking can legitimately produce several of these.
 */
export async function enqueueEmails(
  client: Prisma.TransactionClient | typeof prisma,
  kind: string,
  emails: OutboundEmail[],
) {
  if (emails.length === 0) return;
  const site = await getSiteSettings();
  const sender = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
  await client.emailJob.createMany({
    data: emails.map((email) => ({
      id: `${kind}-${randomUUID()}`,
      bookingReference: email.bookingReference,
      recipient: email.to,
      sender,
      subject: email.subject,
      body: email.body,
    })),
  });
}

async function deliverEmail(job: EmailJob) {
  if (!process.env.RESEND_API_KEY) throw new Error("Email provider is not configured");
  const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: job.sender, to: job.recipient, subject: job.subject, text: job.body,
  }, { idempotencyKey: job.id });
  if (result.error || !result.data?.id) throw new Error("Email provider rejected delivery");
}

/** Durable retries with a lease; provider idempotency covers crash-after-send retries. */
export async function processEmailJobs(limit = 3, send: (job: EmailJob) => Promise<void> = deliverEmail) {
  if (send === deliverEmail && !process.env.RESEND_API_KEY) return { sent: 0, failed: 0, unavailable: true };
  const result = { sent: 0, failed: 0, unavailable: false };
  for (let i = 0; i < Math.min(Math.max(limit, 0), 20); i++) {
    const token = randomUUID();
    const job = await prisma.$transaction(async tx => {
      const rows = await tx.$queryRaw<EmailJob[]>(Prisma.sql`
        SELECT * FROM "EmailJob"
        WHERE "sentAt" IS NULL AND attempts < 8 AND "availableAt" <= (NOW() AT TIME ZONE 'UTC')
          AND ("lockedUntil" IS NULL OR "lockedUntil" < (NOW() AT TIME ZONE 'UTC'))
          AND ("firstAttemptAt" IS NULL OR "firstAttemptAt" > (NOW() AT TIME ZONE 'UTC') - INTERVAL '23 hours')
        ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT 1`);
      if (!rows[0]) return null;
      return tx.emailJob.update({ where: { id: rows[0].id }, data: {
        leaseToken: token, lockedUntil: new Date(Date.now() + 10 * 60_000),
        firstAttemptAt: rows[0].firstAttemptAt ?? new Date(), attempts: { increment: 1 },
      } });
    });
    if (!job) break;
    try {
      await send(job);
      await prisma.emailJob.updateMany({ where: { id: job.id, leaseToken: token },
        data: { sentAt: new Date(), lockedUntil: null, leaseToken: null, lastError: null } });
      result.sent++;
    } catch {
      await prisma.emailJob.updateMany({ where: { id: job.id, leaseToken: token }, data: {
        lockedUntil: null, leaseToken: null, lastError: "Delivery failed; check provider configuration and logs.",
        availableAt: new Date(Date.now() + Math.min(60, 2 ** job.attempts) * 60_000),
      } });
      result.failed++;
    }
  }
  return result;
}

/**
 * Queue emails whose ids are derived from what they are about (for example
 * `reminder-24h-<bookingId>`). Re-running a job, a second replica, or a crash
 * mid-run cannot create a second copy: duplicates are skipped by primary key,
 * and the worker's idempotency key is the same id. Returns how many were new.
 */
export async function enqueueUniqueEmails(
  client: Prisma.TransactionClient | typeof prisma,
  emails: (OutboundEmail & { id: string })[],
) {
  if (emails.length === 0) return 0;
  const site = await getSiteSettings();
  const sender = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
  const result = await client.emailJob.createMany({
    data: emails.map((email) => ({
      id: email.id,
      bookingReference: email.bookingReference,
      recipient: email.to,
      sender,
      subject: email.subject,
      body: email.body,
    })),
    skipDuplicates: true,
  });
  return result.count;
}
