"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { cancelDeparture } from "@/lib/cancel-departure";
import { prisma } from "@/lib/db";
import { generateSessions } from "@/lib/availability";
import { sessionsOverlap } from "@/lib/vehicles";
import { aucklandLocalToUtc, aucklandDateOnly } from "@/lib/time";
import { getCurrentAdmin } from "@/lib/auth";
import { parseSettingsJson, parseTourPrices } from "@/lib/cms-validation";

async function assertAdmin() {
  const session = await getCurrentAdmin();
  if (!session) redirect("/admin/login");
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string, d = 0) => { const n = Number(fd.get(k)); return Number.isFinite(n) ? n : d; };
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
const lines = (fd: FormData, k: string) => str(fd, k).split("\n").map((s) => s.trim()).filter(Boolean);
const csvNums = (fd: FormData, k: string) => str(fd, k).split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));

// Public pages render dynamically, so no cache-tag invalidation is required.
function revalidateAll() {
  revalidatePath("/", "layout");
}

// ─── Tours ──────────────────────────────────────────────────────────────────
export async function saveTour(_previous: { error: string }, fd: FormData) {
  await assertAdmin();
  const id = str(fd, "id");
  const gallery = lines(fd, "gallery");
  let priceOptions;
  try {
    priceOptions = parseTourPrices(str(fd, "priceOptions"));
    const duration = num(fd, "durationMins", 480);
    if (!str(fd, "title") || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(str(fd, "slug"))) throw new Error("A title and lowercase hyphenated slug are required.");
    if (!Number.isInteger(duration) || duration <= 0 || duration >= 1440) throw new Error("Day trips must have a duration between 1 and 1439 minutes.");
  } catch (error) { return { error: error instanceof Error ? error.message : "Invalid tour" }; }
  const priceFromCents = priceOptions.length ? Math.min(...priceOptions.map((p) => p.priceCents)) : num(fd, "priceFromCents") * 100;

  const defaultVehicleId = str(fd, "defaultVehicleId") || null;
  const [vehicleSeats, existingTour] = await Promise.all([
    defaultVehicleId
      ? prisma.vehicle.findUnique({ where: { id: defaultVehicleId }, select: { seats: true } }).then((v) => v?.seats)
      : Promise.resolve(undefined),
    id ? prisma.tour.findUnique({ where: { id }, select: { capacityPerDeparture: true } }) : Promise.resolve(null),
  ]);

  const data = {
    slug: str(fd, "slug"),
    code: str(fd, "code"),
    title: str(fd, "title"),
    summary: str(fd, "summary"),
    descriptionLong: str(fd, "descriptionLong") || null,
    destination: str(fd, "destination"),
    destinationSlug: str(fd, "destinationSlug"),
    category: str(fd, "category") || "iconic-day-trips",
    durationLabel: str(fd, "durationLabel") || "1 Day",
    durationMins: num(fd, "durationMins", 480),
    ageRange: str(fd, "ageRange") || "All Ages",
    startEnd: str(fd, "startEnd"),
    pickup: str(fd, "pickup"),
    priceFromCents,
    heroImage: gallery[0] ?? str(fd, "heroImage"),
    gallery,
    highlights: lines(fd, "highlights"),
    itinerary: lines(fd, "itinerary"),
    included: lines(fd, "included"),
    optionalUpgrades: lines(fd, "optionalUpgrades"),
    importantInfo: lines(fd, "importantInfo"),
    featured: bool(fd, "featured"),
    closedMonths: csvNums(fd, "closedMonths"),
    departureTimes: str(fd, "departureTimes").split(",").map((s) => s.trim()).filter(Boolean),
    departureWeekdays: csvNums(fd, "departureWeekdays"),
    defaultVehicleId,
    capacityPerDeparture: vehicleSeats ?? existingTour?.capacityPerDeparture ?? 12,
    sortOrder: num(fd, "sortOrder"),
    isActive: bool(fd, "isActive"),
  };

  try {
    await prisma.$transaction(async (tx) => {
      const tour = id
        ? await tx.tour.update({ where: { id }, data })
        : await tx.tour.create({ data });

      // Replace price options.
      await tx.priceOption.deleteMany({ where: { tourId: tour.id, key: { notIn: priceOptions.map((p) => p.key) } } });
      for (const po of priceOptions) {
        await tx.priceOption.upsert({
          where: { tourId_key: { tourId: tour.id, key: po.key } },
          create: { tourId: tour.id, ...po },
          update: { label: po.label, priceCents: po.priceCents, seatsPerUnit: po.seatsPerUnit, sortOrder: po.sortOrder },
        });
      }

    });

  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'P2002') return { error: 'This slug or price key is already in use. No changes were saved.' };
    if (code === 'P2003') return { error: 'A price option is referenced by existing bookings and cannot be removed. No changes were saved.' };
    throw error;
  }

  revalidateAll();
  revalidatePath("/admin/tours");
  redirect("/admin/tours");
}

export async function deleteTour(fd: FormData) {
  await assertAdmin();
  await prisma.tour.delete({ where: { id: str(fd, "id") } });
  revalidateAll();
  revalidatePath("/admin/tours");
}

export async function regenerateDepartures(fd: FormData) {
  await assertAdmin();
  const id = str(fd, "id");
  const tour = await prisma.tour.findUnique({ where: { id } });
  let conflicts = 0;
  if (tour) {
    const result = await generateSessions({
      tourId: tour.id, times: tour.departureTimes, weekdays: tour.departureWeekdays,
      capacity: tour.capacityPerDeparture, durationMins: tour.durationMins,
      vehicleId: tour.defaultVehicleId ?? undefined,
      horizonDays: 90, closedMonths: tour.closedMonths,
    });
    conflicts = result.conflicts.length;
  }
  revalidatePath(`/admin/tours/${id}`);
  redirect(`/admin/tours/${id}${conflicts > 0 ? `?vehicleConflicts=${conflicts}` : ""}`);
}

export async function cancelSession(fd: FormData) {
  await assertAdmin();
  const sessionId = str(fd, "sessionId");
  const tourId = str(fd, "tourId");

  await cancelDeparture(sessionId, tourId);

  revalidatePath(`/admin/tours/${tourId}`);
}

export async function addSession(fd: FormData) {
  await assertAdmin();
  const tourId = str(fd, "tourId");
  const date = str(fd, "date"); // YYYY-MM-DD (Auckland)
  const time = str(fd, "time"); // HH:mm
  const vehicleId = str(fd, "vehicleId") || null;
  if (!date || !time) return;

  const startsAtUtc = aucklandLocalToUtc(date, time);
  const [tour, vehicle, existing] = await Promise.all([
    prisma.tour.findUnique({ where: { id: tourId }, select: { durationMins: true, capacityPerDeparture: true } }),
    vehicleId ? prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { seats: true } }) : null,
    prisma.session.findUnique({ where: { tourId_startsAtUtc: { tourId, startsAtUtc } }, select: { id: true } }),
  ]);
  if (!tour) return;
  const capacity = vehicle?.seats ?? tour.capacityPerDeparture;

  if (vehicleId) {
    const busy = await prisma.session.findMany({
      where: {
        vehicleId,
        status: "SCHEDULED",
        id: existing ? { not: existing.id } : undefined,
      },
      select: { startsAtUtc: true, tour: { select: { title: true, durationMins: true } } },
    });
    const conflict = busy.find((b) =>
      sessionsOverlap(startsAtUtc, tour.durationMins, b.startsAtUtc, b.tour.durationMins),
    );
    if (conflict) {
      redirect(
        `/admin/tours/${tourId}?vehicleError=${encodeURIComponent(
          `Vehicle already booked for ${conflict.tour.title} at that time`,
        )}`,
      );
    }
  }

  await prisma.session.upsert({
    where: { tourId_startsAtUtc: { tourId, startsAtUtc } },
    create: { tourId, startsAtUtc, localDate: aucklandDateOnly(date), capacity, vehicleId },
    update: { capacity, vehicleId, status: "SCHEDULED" },
  });
  revalidatePath(`/admin/tours/${tourId}`);
}

// ─── Destinations ─────────────────────────────────────────────────────────────
export async function saveDestination(fd: FormData) {
  await assertAdmin();
  const id = str(fd, "id");
  const data = {
    slug: str(fd, "slug"), name: str(fd, "name"), status: str(fd, "status") || "active",
    blurb: str(fd, "blurb"), intro: str(fd, "intro") || null, heroImage: str(fd, "heroImage") || null,
    sortOrder: num(fd, "sortOrder"),
  };
  if (id) await prisma.destination.update({ where: { id }, data });
  else await prisma.destination.create({ data });
  revalidateAll();
  redirect("/admin/destinations");
}
export async function deleteDestination(fd: FormData) {
  await assertAdmin();
  await prisma.destination.delete({ where: { id: str(fd, "id") } });
  revalidateAll(); revalidatePath("/admin/destinations");
}

// ─── Blog ───────────────────────────────────────────────────────────────────
export async function savePost(fd: FormData) {
  await assertAdmin();
  const id = str(fd, "id");
  const data = {
    slug: str(fd, "slug"), title: str(fd, "title"), excerpt: str(fd, "excerpt"),
    body: str(fd, "body").split("\n\n").map((s) => s.trim()).filter(Boolean),
    coverImage: str(fd, "coverImage") || null, published: bool(fd, "published"),
    date: new Date(str(fd, "date") || Date.now()),
    category: str(fd, "category") || "general",
    tags: str(fd, "tags").split(",").map((s) => s.trim()).filter(Boolean),
    metaDescription: str(fd, "metaDescription") || null,
  };
  if (id) await prisma.blogPost.update({ where: { id }, data });
  else await prisma.blogPost.create({ data });
  revalidateAll();
  redirect("/admin/blog");
}
export async function deletePost(fd: FormData) {
  await assertAdmin();
  await prisma.blogPost.delete({ where: { id: str(fd, "id") } });
  revalidateAll(); revalidatePath("/admin/blog");
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
export async function saveTestimonial(fd: FormData) {
  await assertAdmin();
  const id = str(fd, "id");
  const data = {
    name: str(fd, "name"), country: str(fd, "country"), text: str(fd, "text"),
    rating: num(fd, "rating", 5), sortOrder: num(fd, "sortOrder"), published: bool(fd, "published"),
  };
  if (id) await prisma.testimonial.update({ where: { id }, data });
  else await prisma.testimonial.create({ data });
  revalidateAll();
  redirect("/admin/testimonials");
}
export async function deleteTestimonial(fd: FormData) {
  await assertAdmin();
  await prisma.testimonial.delete({ where: { id: str(fd, "id") } });
  revalidateAll(); revalidatePath("/admin/testimonials");
}

// ─── Site settings ─────────────────────────────────────────────────────────────
export async function saveSettings(_previous: { error: string }, fd: FormData) {
  await assertAdmin();
  let structured;
  try { structured = parseSettingsJson(fd); }
  catch (error) { return { error: error instanceof Error ? error.message : "Invalid settings" }; }
  await prisma.siteSetting.update({
    where: { id: "singleton" },
    data: {
      name: str(fd, "name"), tagline: str(fd, "tagline"), description: str(fd, "description"),
      logoImage: str(fd, "logoImage") || null,
      phone: str(fd, "phone"), phoneHref: str(fd, "phoneHref"), email: str(fd, "email"), address: str(fd, "address"),
      currency: str(fd, "currency") || "NZD", heroImage: str(fd, "heroImage"), footerTagline: str(fd, "footerTagline"),
      ...structured,
    },
  });
  revalidatePath("/", "layout");
  redirect("/admin/settings");
}

// ─── Admin users ───────────────────────────────────────────────────────────────
export async function createUser(fd: FormData) {
  await assertAdmin();
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  if (email && password) {
    await prisma.adminUser.create({
      data: { email, name: str(fd, "name"), role: str(fd, "role") || "admin", passwordHash: await bcrypt.hash(password, 10) },
    });
  }
  revalidatePath("/admin/users");
}
export async function deleteUser(fd: FormData) {
  await assertAdmin();
  await prisma.adminUser.delete({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/users");
}

// ─── Promo Codes ──────────────────────────────────────────────────────────────
export async function createPromoCode(fd: FormData) {
  await assertAdmin();
  const code = str(fd, "code").toUpperCase();
  const type = str(fd, "type") === "fixed" ? "fixed" : "percentage";
  const value = num(fd, "value");
  const minSpendCents = Math.round(num(fd, "minSpend", 0) * 100);
  const maxUsesRaw = str(fd, "maxUses");
  const maxUses = maxUsesRaw ? parseInt(maxUsesRaw) : null;
  const expiresRaw = str(fd, "expiresAt");
  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;
  if (!code || value <= 0) return;
  await prisma.promoCode.create({
    data: { code, description: str(fd, "description"), type, value, minSpendCents, maxUses, expiresAt },
  });
  revalidatePath("/admin/promo-codes");
}

export async function deletePromoCode(fd: FormData) {
  await assertAdmin();
  await prisma.promoCode.delete({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/promo-codes");
}

export async function updatePromoCode(fd: FormData) {
  await assertAdmin();
  const id = str(fd, "id");
  if (!id) return;
  const maxUsesRaw = str(fd, "maxUses");
  await prisma.promoCode.update({
    where: { id },
    data: {
      description: str(fd, "description"),
      type: str(fd, "type") === "fixed" ? "fixed" : "percentage",
      value: num(fd, "value"),
      minSpendCents: Math.round(num(fd, "minSpend", 0) * 100),
      maxUses: maxUsesRaw ? parseInt(maxUsesRaw) : null,
      expiresAt: str(fd, "expiresAt") ? new Date(str(fd, "expiresAt")) : null,
      isActive: bool(fd, "isActive"),
    },
  });
  revalidatePath("/admin/promo-codes");
}

export async function togglePromoCode(fd: FormData) {
  await assertAdmin();
  const promo = await prisma.promoCode.findUnique({ where: { id: str(fd, "id") } });
  if (promo) await prisma.promoCode.update({ where: { id: promo.id }, data: { isActive: !promo.isActive } });
  revalidatePath("/admin/promo-codes");
}

// ─── Waitlist ─────────────────────────────────────────────────────────────────
export async function markWaitlistNotified(fd: FormData) {
  await assertAdmin();
  await prisma.waitlist.update({ where: { id: str(fd, "id") }, data: { notified: true } });
  revalidatePath("/admin/waitlist");
}

export async function deleteWaitlistEntry(fd: FormData) {
  await assertAdmin();
  await prisma.waitlist.delete({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/waitlist");
}
