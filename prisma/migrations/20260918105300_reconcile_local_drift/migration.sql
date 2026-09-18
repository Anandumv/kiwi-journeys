-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "EmailJob" ALTER COLUMN "availableAt" SET DEFAULT (now() AT TIME ZONE 'UTC'),
ALTER COLUMN "createdAt" SET DEFAULT (now() AT TIME ZONE 'UTC');

-- AlterTable
ALTER TABLE "PaymentIssue" ALTER COLUMN "createdAt" SET DEFAULT (now() AT TIME ZONE 'UTC');
