import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { getSiteSettings } from "./content";

export async function activateGiftVoucher(voucherId: string, payment: {
  id: string; currency: string; amount_received: number;
}) {
  const site = await getSiteSettings();
  const sender = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";
  return prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "GiftVoucher" WHERE id = ${voucherId} FOR UPDATE`);
    const voucher = await tx.giftVoucher.findUniqueOrThrow({ where: { id: voucherId } });
    if (voucher.stripePaymentIntentId !== payment.id || payment.currency !== "nzd" || payment.amount_received !== voucher.amountCents) {
      throw new Error("Gift voucher payment mismatch");
    }
    if (voucher.isActive) return;
    await tx.giftVoucher.update({ where: { id: voucherId }, data: { isActive: true } });
    const expiry = voucher.expiresAt?.toLocaleDateString("en-NZ", { timeZone: "Pacific/Auckland", day: "numeric", month: "long", year: "numeric" }) || "No expiry";
    const details = `Code: ${voucher.code}\nValue: NZD ${(voucher.amountCents / 100).toFixed(2)}\nValid until: ${expiry}\n\nUse this code when booking a tour: ${baseUrl}/tours\n`;
    await tx.emailJob.create({ data: {
      id: `voucher-${voucher.id}-purchaser`, bookingReference: voucher.code, sender,
      recipient: voucher.purchaserEmail, subject: `Your ${site.name} gift voucher is ready!`,
      body: `Hi ${voucher.purchaserName},\n\nYour gift voucher has been activated.\n\n${details}\n${site.name}\n${site.phone}`,
    } });
    if (voucher.recipientEmail && voucher.recipientEmail.toLowerCase() !== voucher.purchaserEmail.toLowerCase()) {
      await tx.emailJob.create({ data: {
        id: `voucher-${voucher.id}-recipient`, bookingReference: voucher.code, sender,
        recipient: voucher.recipientEmail, subject: `You've received a ${site.name} gift voucher!`,
        body: `Hi ${voucher.recipientName || "there"},\n\n${voucher.purchaserName} has sent you a gift voucher.\n\n${voucher.message ? `${voucher.message}\n\n` : ""}${details}\n${site.name}`,
      } });
    }
  });
}
