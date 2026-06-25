import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTour } from "@/lib/content";
import { BookingWidget } from "@/components/BookingWidget";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTour(slug);
  return { title: tour ? `Book — ${tour.title}` : "Book" };
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getTour(slug);
  if (!content) notFound();

  // Use DB price options (with real ids) when available; fall back to the static
  // content's options (UI-only deploy) so the page still renders without a DB.
  let priceOptions = content.priceOptions.map((p) => ({ id: p.key, key: p.key, label: p.label, priceCents: p.priceCents, seatsPerUnit: p.seatsPerUnit }));
  try {
    const tour = await prisma.tour.findUnique({ where: { slug }, include: { priceOptions: { orderBy: { sortOrder: "asc" } } } });
    if (tour) priceOptions = tour.priceOptions.map((p) => ({ id: p.id, key: p.key, label: p.label, priceCents: p.priceCents, seatsPerUnit: p.seatsPerUnit }));
  } catch {
    /* no DB — keep static fallback options */
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href={`/tours/${slug}`} className="text-sm font-semibold text-brand-600 hover:underline">← Back to tour details</Link>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-brand-900">Book: {content.title}</h1>
      <p className="mt-2 text-foreground/70">Choose your date, departure time and number of guests.</p>
      <div className="mt-8">
        <BookingWidget slug={slug} title={content.title} priceOptions={priceOptions} />
      </div>
    </div>
  );
}
