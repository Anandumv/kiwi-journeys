-- Customer profile fields for campaign targeting and legal consent
ALTER TABLE "Customer" ADD COLUMN "marketingConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Customer" ADD COLUMN "smsConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Customer" ADD COLUMN "country" TEXT;
ALTER TABLE "Customer" ADD COLUMN "travelStyle" TEXT[] DEFAULT '{}';
ALTER TABLE "Customer" ADD COLUMN "groupType" TEXT;
ALTER TABLE "Customer" ADD COLUMN "ageGroup" TEXT;
ALTER TABLE "Customer" ADD COLUMN "isCruisePassenger" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Customer" ADD COLUMN "referralSource" TEXT;
ALTER TABLE "Customer" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- BlogPost SEO and taxonomy fields
ALTER TABLE "BlogPost" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'general';
ALTER TABLE "BlogPost" ADD COLUMN "tags" TEXT[] DEFAULT '{}';
ALTER TABLE "BlogPost" ADD COLUMN "metaDescription" TEXT;

-- Magic link authentication tokens for customer accounts
CREATE TABLE "MagicToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MagicToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MagicToken_token_key" ON "MagicToken"("token");
CREATE INDEX "MagicToken_email_idx" ON "MagicToken"("email");
CREATE INDEX "MagicToken_token_idx" ON "MagicToken"("token");

-- Post-tour survey responses
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "wouldReturn" BOOLEAN NOT NULL DEFAULT true,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SurveyResponse_bookingId_key" ON "SurveyResponse"("bookingId");
