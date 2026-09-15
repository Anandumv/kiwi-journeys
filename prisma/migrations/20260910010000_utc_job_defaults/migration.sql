-- Prisma DateTime values are UTC timestamps without a timezone. Do not let
-- the PostgreSQL session timezone shift server-generated delivery timestamps.
ALTER TABLE "EmailJob" ALTER COLUMN "availableAt" SET DEFAULT (now() AT TIME ZONE 'UTC');
ALTER TABLE "EmailJob" ALTER COLUMN "createdAt" SET DEFAULT (now() AT TIME ZONE 'UTC');
ALTER TABLE "PaymentIssue" ALTER COLUMN "createdAt" SET DEFAULT (now() AT TIME ZONE 'UTC');
