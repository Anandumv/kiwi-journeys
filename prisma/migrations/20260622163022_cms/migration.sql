-- AlterTable
ALTER TABLE "Tour" ADD COLUMN     "ageRange" TEXT NOT NULL DEFAULT 'All Ages',
ADD COLUMN     "capacityPerDeparture" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'iconic-day-trips',
ADD COLUMN     "closedMonths" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "code" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "departureTimes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "departureWeekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "descriptionLong" TEXT,
ADD COLUMN     "destinationSlug" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "durationLabel" TEXT NOT NULL DEFAULT '1 Day',
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "heroImage" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "importantInfo" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "included" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "itinerary" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "optionalUpgrades" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pickup" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "priceFromCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startEnd" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "blurb" TEXT NOT NULL DEFAULT '',
    "intro" TEXT,
    "heroImage" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "body" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "coverImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT '',
    "text" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "name" TEXT NOT NULL DEFAULT 'Kiwi Journeys',
    "tagline" TEXT NOT NULL DEFAULT 'Your Journey. Your New Zealand.',
    "description" TEXT NOT NULL DEFAULT '',
    "logoImage" TEXT,
    "phone" TEXT NOT NULL DEFAULT '',
    "phoneHref" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'NZD',
    "heroImage" TEXT NOT NULL DEFAULT '',
    "footerTagline" TEXT NOT NULL DEFAULT '',
    "social" JSONB NOT NULL DEFAULT '{}',
    "stats" JSONB NOT NULL DEFAULT '[]',
    "nav" JSONB NOT NULL DEFAULT '[]',
    "valueProps" JSONB NOT NULL DEFAULT '[]',
    "currencyRates" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Destination_slug_key" ON "Destination"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
