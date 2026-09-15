import { randomUUID } from "node:crypto";
import { Prisma, type EmailJob } from "@prisma/client";
import { Resend } from "resend";
import { prisma } from "./db";
import { getSiteSettings } from "./content";
import { formatNZD } from "./money";
import { dateLabel, timeLabel } from "./time";

export async function enqueueBookingEmails(tx: Prisma.TransactionClient, args: {
  reference: string; to: string; customerName: string; tourTitle: string;
  startsAtUtc: Date; totalCents: number; seats: number;
}) {
  const site = await getSiteSettings();
  const sender = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
  const details = `Reference: ${args.reference}\nTour: ${args.tourTitle}\nDate: ${dateLabel(args.startsAtUtc)} at ${timeLabel(args.startsAtUtc)} (NZ time)\nGuests: ${args.seats}\nTotal paid: ${formatNZD(args.totalCents)} NZD\n`;
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
