import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTours, getDestinations, getTestimonials, getSiteSettings } from "@/lib/content";
import { categories } from "@/data/tours";
import { TourCard } from "@/components/TourCard";
import { Reveal } from "@/components/Reveal";
import { Blob, Frond } from "@/components/OrganicShape";
import { WhyBookDirect } from "@/components/WhyBookDirect";
import { NewsletterSignup } from "@/components/NewsletterSignup";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: `${s.name} — New Zealand Small-Group Day Tours`,
    description: `Explore the South Island with ${s.name}. Small groups, local guides, year-round departures from Christchurch. Book online — free cancellation.`,
    alternates: { canonical: SITE_URL },
    openGraph: {
      title: `${s.name} — New Zealand Small-Group Day Tours`,
      description: s.description,
      url: SITE_URL,
      images: s.heroImage ? [{ url: s.heroImage, width: 1200, height: 630, alt: "Kiwi Journeys — South Island Day Tours" }] : undefined,
    },
  };
}

const experienceImages: Record<string, string> = {
  "iconic-day-trips": "/images/brand/Discover.jpg",
  wildlife: "/images/brand/Glow-Worms.jpg",
  adventure: "/images/brand/Adventure.jpg",
  "wine-food": "/images/brand/Queens.jpg",
};

export default async function HomePage() {
  const [tours, destinations, testimonials, s] = await Promise.all([
    getTours(),
    getDestinations(),
    getTestimonials(),
    getSiteSettings(),
  ]);
  const featured = tours.filter((t) => t.featured).slice(0, 6);

  const reviewsLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Guest Reviews",
    itemListElement: testimonials.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Review",
        reviewRating: { "@type": "Rating", ratingValue: t.rating, bestRating: 5 },
        author: { "@type": "Person", name: t.name },
        reviewBody: t.text,
        itemReviewed: { "@id": `${SITE_URL}/#organization` },
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsLd) }} />
      {/* Hero */}
      <section className="relative isolate -mt-16 flex min-h-[88vh] items-center overflow-hidden sm:min-h-[92vh]">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image src={s.heroImage} alt="" fill priority sizes="100vw" className="animate-kenburns object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950/90 via-brand-950/65 to-brand-950/30" />
        <div className="mx-auto w-full max-w-7xl px-5 pt-20 sm:px-6">
          <p className="eyebrow text-sand-400">{s.tagline}</p>
          <h1 className="mt-4 max-w-3xl font-serif text-[2.5rem] font-semibold leading-[1.08] text-white text-balance sm:mt-5 sm:text-6xl sm:leading-[1.05] lg:text-7xl">
            The South Island, at its own pace
          </h1>
          <p className="mt-5 max-w-xl text-base text-brand-100/90 sm:text-lg">{s.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link href="/tours" className="rounded-full bg-sand-500 px-7 py-3.5 text-center font-semibold text-brand-950 transition hover:bg-sand-400">
              Explore Tours
            </Link>
            <Link href="/contact" className="rounded-full border border-white/40 px-7 py-3.5 text-center font-semibold text-white backdrop-blur-sm transition hover:bg-white/10">
              Plan a Private Tour
            </Link>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-ivory-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-4 text-sm font-medium text-foreground/70 sm:px-6">
          <span className="flex items-center gap-2"><span className="text-gold-500">★★★★★</span> <strong className="text-foreground">4.9/5</strong>&nbsp;· 200+ happy guests</span>
          <span className="hidden text-ivory-200 sm:inline">|</span>
          <span className="flex items-center gap-2"><span className="text-teal-600">✓</span> Free cancellation</span>
          <span className="hidden text-ivory-200 sm:inline">|</span>
          <span className="flex items-center gap-2"><span className="text-teal-600">✓</span> Small groups · max 16</span>
          <span className="hidden text-ivory-200 sm:inline">|</span>
          <span className="flex items-center gap-2"><span className="text-teal-600">✓</span> No booking fees</span>
          <span className="hidden text-ivory-200 sm:inline">|</span>
          <span className="flex items-center gap-2">🔒 Secure payment</span>
        </div>
      </section>

      {/* Featured tours */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 py-14 sm:px-6 sm:py-20">
        <Blob className="pointer-events-none absolute -right-24 -top-10 -z-0 h-72 w-72 text-brand-100/70 animate-floaty" />
        <Frond className="pointer-events-none absolute -left-10 bottom-10 -z-0 h-40 w-40 text-sand-400/30" />
        <Reveal>
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow text-sand-600">Handpicked days out</p>
              <h2 className="mt-3 font-serif text-4xl font-semibold text-brand-900">Our favourite tours</h2>
            </div>
            <Link href="/tours" className="hidden text-sm font-semibold text-brand-600 hover:underline sm:block">View all tours →</Link>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((t, i) => (
            <Reveal key={t.slug} delay={(i % 3) * 0.08}>
              <TourCard tour={t} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Value props — full-bleed band */}
      <section className="bg-brand-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <Reveal>
            <p className="eyebrow text-sand-400">Ways to explore</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold">However you'd rather travel</h2>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {s.valueProps.map((v, i) => (
              <Reveal key={v.title} delay={(i % 4) * 0.08}>
                <div className="border-t border-brand-700/60 pt-5">
                  <h3 className="font-serif text-xl text-sand-400">{v.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-brand-100/85">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <Reveal>
          <p className="eyebrow text-brand-500">Travel New Zealand Your Way</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold text-brand-900">Explore Destinations</h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {destinations.map((d) => (
            <Link
              key={d.slug}
              href={d.status === "active" ? `/destinations/${d.slug}` : "/destinations"}
              className={`rounded-xl border p-5 transition ${
                d.status === "active"
                  ? "border-brand-200 bg-white hover:border-brand-400 hover:shadow-md"
                  : "border-dashed border-ivory-200 bg-ivory/60 text-foreground/45"
              }`}
            >
              <div className="font-serif text-lg text-brand-800">{d.name}</div>
              <div className="mt-1 text-xs text-foreground/55">{d.status === "active" ? d.blurb : "Coming Soon"}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Browse by experience */}
      <section className="border-y border-ivory-200 bg-ivory">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <Reveal>
            <p className="eyebrow text-sand-600">Browse by experience</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold text-brand-900">Find your kind of day</h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {categories.map((c, i) => (
              <Reveal key={c.key} delay={(i % 4) * 0.07}>
                <Link href={`/tours?type=${c.key}`} className="group relative block aspect-[4/5] overflow-hidden rounded-[1.6rem_1.6rem_0.75rem_0.75rem]">
                  <Image src={experienceImages[c.key] ?? "/images/brand/Discover.jpg"} alt={c.label} fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-brand-950/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="font-serif text-xl font-semibold text-white">{c.label}</h3>
                    <span className="mt-1 inline-block text-sm text-white/80 transition group-hover:translate-x-0.5">Explore →</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <Reveal>
          <h2 className="font-serif text-4xl font-semibold text-brand-900">What our guests say</h2>
        </Reveal>
        <div className="mt-10 grid gap-7 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={(i % 3) * 0.08}>
              <figure className="relative h-full overflow-hidden rounded-2xl border border-ivory-200 bg-white p-7 shadow-sm">
                <span aria-hidden className="pointer-events-none absolute -right-1 -top-8 select-none font-serif text-[7rem] leading-none text-brand-100">&rdquo;</span>
                <div className="relative">
                  <div className="text-gold-500">{"★".repeat(t.rating)}</div>
                  <div className="mt-3 h-px w-10 bg-gold-400/70" />
                  <blockquote className="mt-4 font-serif text-lg italic leading-relaxed text-brand-900">{t.text}</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-serif text-sm font-semibold text-brand-700">{t.name.charAt(0)}</span>
                    <span className="text-sm font-semibold text-brand-800">{t.name} <span className="font-normal text-foreground/50">· {t.country}</span></span>
                  </figcaption>
                </div>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      <WhyBookDirect />
      <NewsletterSignup />

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="paper-grain relative isolate overflow-hidden rounded-3xl px-8 py-20 text-center text-white">
          <Image src="/images/brand/Queens.jpg" alt="" fill sizes="100vw" className="-z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-950/92 via-brand-900/80 to-brand-800/70" />
          <Blob className="pointer-events-none absolute -right-20 -top-16 -z-0 h-72 w-72 text-white/[0.06] animate-floaty" />
          <p className="eyebrow text-gold-400">Your adventure awaits</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">Ready for your New Zealand journey?</h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-100/90">Browse our day tours, choose your date, and book online in minutes.</p>
          <Link href="/tours" className="mt-8 inline-block rounded-full bg-sand-500 px-8 py-3.5 font-semibold text-white shadow-lg transition hover:bg-sand-700">Find your tour</Link>
        </div>
      </section>
    </>
  );
}
