"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { generateSessions } from "@/lib/availability";
import { aucklandLocalToUtc, aucklandDateOnly } from "@/lib/time";

// ─── helpers ──────────────────────────────────────────────────────────────────
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string, d = 0) => { const n = Number(fd.get(k)); return Number.isFinite(n) ? n : d; };
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
const lines = (fd: FormData, k: string) => str(fd, k).split("\n").map((s) => s.trim()).filter(Boolean);
const csvNums = (fd: FormData, k: string) => str(fd, k).split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
const dollarsToCents = (v: string) => Math.round(parseFloat(v || "0") * 100);

// Public pages render dynamically, so no cache-tag invalidation is required.
function revalidateAll() {
  revalidatePath("/", "layout");
}

// ─── Tours ──────────────────────────────────────────────────────────────────
export async function saveTour(fd: FormData) {
  const id = str(fd, "id");
  const gallery = lines(fd, "gallery");
  const priceOptions = lines(fd, "priceOptions").map((line, i) => {
    // format: key | label | dollars | seatsPerUnit
    const [key, label, dollars, seats] = line.split("|").map((s) => s.trim());
    return { key: key || `opt${i}`, label: label || key || `Option ${i + 1}`, priceCents: dollarsToCents(dollars), seatsPerUnit: Number(seats) || 1, sortOrder: i };
  });
  const priceFromCents = priceOptions.length ? Math.min(...priceOptions.map((p) => p.priceCents)) : num(fd, "priceFromCents") * 100;

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
    capacityPerDeparture: num(fd, "capacityPerDeparture", 12),
    sortOrder: num(fd, "sortOrder"),
    isActive: bool(fd, "isActive"),
  };

  const tour = id
    ? await prisma.tour.update({ where: { id }, data })
    : await prisma.tour.create({ data });

  // Replace price options.
  await prisma.priceOption.deleteMany({ where: { tourId: tour.id, key: { notIn: priceOptions.map((p) => p.key) } } });
  for (const po of priceOptions) {
    await prisma.priceOption.upsert({
      where: { tourId_key: { tourId: tour.id, key: po.key } },
      create: { tourId: tour.id, ...po },
      update: { label: po.label, priceCents: po.priceCents, seatsPerUnit: po.seatsPerUnit, sortOrder: po.sortOrder },
    });
  }

  revalidateAll();
  revalidatePath("/admin/tours");
  redirect("/admin/tours");
}

export async function deleteTour(fd: FormData) {
  await prisma.tour.delete({ where: { id: str(fd, "id") } });
  revalidateAll();
  revalidatePath("/admin/tours");
}

export async function regenerateDepartures(fd: FormData) {
  const tour = await prisma.tour.findUnique({ where: { id: str(fd, "id") } });
  if (tour) {
    await generateSessions({
      tourId: tour.id, times: tour.departureTimes, weekdays: tour.departureWeekdays,
      capacity: tour.capacityPerDeparture, horizonDays: 90, closedMonths: tour.closedMonths,
    });
  }
  revalidatePath(`/admin/tours/${str(fd, "id")}`);
}

export async function cancelSession(fd: FormData) {
  await prisma.session.update({ where: { id: str(fd, "sessionId") }, data: { status: "CANCELLED" } });
  revalidatePath(`/admin/tours/${str(fd, "tourId")}`);
}

export async function addSession(fd: FormData) {
  const tourId = str(fd, "tourId");
  const date = str(fd, "date"); // YYYY-MM-DD (Auckland)
  const time = str(fd, "time"); // HH:mm
  const capacity = num(fd, "capacity", 12);
  if (date && time) {
    await prisma.session.upsert({
      where: { tourId_startsAtUtc: { tourId, startsAtUtc: aucklandLocalToUtc(date, time) } },
      create: { tourId, startsAtUtc: aucklandLocalToUtc(date, time), localDate: aucklandDateOnly(date), capacity },
      update: { capacity, status: "SCHEDULED" },
    });
  }
  revalidatePath(`/admin/tours/${tourId}`);
}

// ─── Destinations ─────────────────────────────────────────────────────────────
export async function saveDestination(fd: FormData) {
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
  await prisma.destination.delete({ where: { id: str(fd, "id") } });
  revalidateAll(); revalidatePath("/admin/destinations");
}

// ─── Blog ───────────────────────────────────────────────────────────────────
export async function savePost(fd: FormData) {
  const id = str(fd, "id");
  const data = {
    slug: str(fd, "slug"), title: str(fd, "title"), excerpt: str(fd, "excerpt"),
    body: str(fd, "body").split("\n\n").map((s) => s.trim()).filter(Boolean),
    coverImage: str(fd, "coverImage") || null, published: bool(fd, "published"),
    date: new Date(str(fd, "date") || Date.now()),
  };
  if (id) await prisma.blogPost.update({ where: { id }, data });
  else await prisma.blogPost.create({ data });
  revalidateAll();
  redirect("/admin/blog");
}
export async function deletePost(fd: FormData) {
  await prisma.blogPost.delete({ where: { id: str(fd, "id") } });
  revalidateAll(); revalidatePath("/admin/blog");
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
export async function saveTestimonial(fd: FormData) {
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
  await prisma.testimonial.delete({ where: { id: str(fd, "id") } });
  revalidateAll(); revalidatePath("/admin/testimonials");
}

// ─── Site settings ─────────────────────────────────────────────────────────────
export async function saveSettings(fd: FormData) {
  const parseJson = (k: string, fallback: unknown) => { try { return JSON.parse(str(fd, k)); } catch { return fallback; } };
  await prisma.siteSetting.update({
    where: { id: "singleton" },
    data: {
      name: str(fd, "name"), tagline: str(fd, "tagline"), description: str(fd, "description"),
      logoImage: str(fd, "logoImage") || null,
      phone: str(fd, "phone"), phoneHref: str(fd, "phoneHref"), email: str(fd, "email"), address: str(fd, "address"),
      currency: str(fd, "currency") || "NZD", heroImage: str(fd, "heroImage"), footerTagline: str(fd, "footerTagline"),
      social: parseJson("social", {}), stats: parseJson("stats", []), nav: parseJson("nav", []),
      valueProps: parseJson("valueProps", []), currencyRates: parseJson("currencyRates", {}),
    },
  });
  revalidatePath("/", "layout");
  redirect("/admin/settings");
}

// ─── Admin users ───────────────────────────────────────────────────────────────
export async function createUser(fd: FormData) {
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
  await prisma.adminUser.delete({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/users");
}
