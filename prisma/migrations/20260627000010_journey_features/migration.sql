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
