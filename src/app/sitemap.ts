import type { MetadataRoute } from "next";
import { getTours, getDestinations, getPosts } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

// Generated at request time so the build doesn't require a database connection.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPaths = ["", "/tours", "/destinations", "/about", "/sustainability", "/contact", "/cruise-excursions", "/travel-insights"];

  let tours: Awaited<ReturnType<typeof getTours>> = [];
  let destinations: Awaited<ReturnType<typeof getDestinations>> = [];
  let posts: Awaited<ReturnType<typeof getPosts>> = [];
  try {
    [tours, destinations, posts] = await Promise.all([getTours(), getDestinations(), getPosts()]);
  } catch {
    // DB unavailable (e.g. during build) — emit the static paths only.
  }

  const priorities: Record<string, number> = { "": 1.0, "/tours": 0.9, "/destinations": 0.8, "/cruise-excursions": 0.75, "/about": 0.6, "/contact": 0.6, "/travel-insights": 0.6, "/sustainability": 0.4 };
  const freq = (p: string) => (p === "" || p === "/tours" ? ("daily" as const) : ("weekly" as const));
  return [
    ...staticPaths.map((p) => ({
      url: `${SITE_URL}${p}`,
      lastModified: now,
      changeFrequency: freq(p),
      priority: priorities[p] ?? 0.5,
    })),
    ...tours.map((t) => ({
      url: `${SITE_URL}/tours/${t.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: t.featured ? 0.9 : 0.8,
    })),
    ...destinations.filter((d) => d.status === "active").map((d) => ({
      url: `${SITE_URL}/destinations/${d.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/travel-insights/${p.slug}`,
      lastModified: new Date(p.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
