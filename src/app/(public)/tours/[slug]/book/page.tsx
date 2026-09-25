import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTour } from "@/lib/content";
import { BookingWidget } from "@/components/BookingWidget";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTour(slug);
  return { title: tour ? `Book — ${tour.title}` : "Book", robots: { index: false, follow: false } };
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getTour(slug);
  if (!content) notFound();

  // Use DB price options (with real ids) when available; fall back to the static
  // content's options (UI-only deploy) so the page still renders without a DB.
  let priceOptions = content.priceOptions.map((p) => ({ id: p.key, key: p.key, label: p.label, priceCents: p.priceCents, seatsPerUnit: p.seatsPerUnit }));
  // Null without a DB, which also correctly disables the waitlist: there would
  // be no tour row to attach a waitlist entry to.
  let tourId: string | null = null;
  try {
    const tour = await prisma.tour.findUnique({ where: { slug }, include: { priceOptions: { orderBy: { sortOrder: "asc" } } } });
    if (tour) {
      tourId = tour.id;
      priceOptions = tour.priceOptions.map((p) => ({ id: p.id, key: p.key, label: p.label, priceCents: p.priceCents, seatsPerUnit: p.seatsPerUnit }));
    }
  } catch {
    /* no DB — keep static fallback options */
  }

  return (
    <div className="bg-[#f8f8f3]">
      <section className="border-b border-[#202b2626] bg-[#e8e6dc]">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-8 md:grid-cols-[minmax(0,1fr)_260px] md:items-end md:py-12">
          <div>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[.13em] text-foreground/75">
              <Link href="/tours" className="underline underline-offset-[3px]">Tours</Link>
              <span aria-hidden="true">/</span>
              <Link href={`/tours/${slug}`} className="underline underline-offset-[3px]">{content.title}</Link>
              <span aria-hidden="true">/</span>
              <span>Book</span>
            </nav>
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-[clamp(52px,7vw,104px)] font-medium leading-[.86] tracking-[-.03em] text-foreground">Choose your day</h1>
            <p className="mt-4 max-w-xl text-foreground/75">{content.title} · {content.durationLabel} · {content.startEnd}. Pick a date, then a departure time and your guests.</p>
          </div>
          {content.heroImage && (
            <div className="relative hidden aspect-[4/3] overflow-hidden md:block">
              <Image src={content.heroImage} alt="" fill sizes="260px" className="object-cover" priority />
            </div>
          )}
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <BookingWidget slug={slug} title={content.title} priceOptions={priceOptions} tourId={tourId} />
        <p className="mt-8 border-t border-[#202b2626] pt-5 text-sm text-foreground/75">
          Full refund when cancelled more than 72 hours before departure. Prices in NZD. <Link href="/contact" className="font-semibold underline underline-offset-4">Questions? Contact us</Link>
        </p>
      </div>
    </div>
  );
}
