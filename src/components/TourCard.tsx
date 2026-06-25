import Link from "next/link";
import Image from "next/image";
import { type Tour, categories } from "@/data/tours";
import { formatNZD } from "@/lib/money";

export function TourCard({ tour }: { tour: Tour }) {
  const categoryLabel = categories.find((c) => c.key === tour.category)?.label ?? "Day tour";
  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-ivory-200 bg-white p-2.5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.6rem_1.6rem_0.75rem_0.75rem] bg-brand-100">
        <Image
          src={tour.heroImage}
          alt={tour.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition group-hover:opacity-100" />
        <span className="absolute left-3 top-3 rounded-full bg-ivory/95 px-2.5 py-1 text-xs font-semibold tracking-wide text-brand-700 shadow-sm">
          {categoryLabel}
        </span>
        {tour.featured && (
          <span className="absolute right-3 top-3 rounded-full bg-gold-500 px-2.5 py-1 text-xs font-semibold tracking-wide text-brand-950 shadow-sm">
            ★ Featured
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-5">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-brand-500">
          <span>{tour.durationLabel}</span>
          <span className="text-brand-200">•</span>
          <span>{tour.destination}</span>
        </div>
        <h3 className="mt-2.5 font-serif text-xl font-semibold leading-snug text-brand-900 transition group-hover:text-brand-600">
          {tour.title}
        </h3>
        <div className="mt-2 flex items-center gap-2 text-xs text-foreground/55">
          <span className="text-gold-500" aria-hidden>★★★★★</span>
          <span>4.9/5</span>
          <span className="text-ivory-300">·</span>
          <span className="text-teal-600 font-medium">Free cancellation</span>
        </div>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-foreground/65">{tour.summary}</p>
        <div className="mt-5 flex items-center justify-between border-t border-ivory-200 pt-4">
          <span className="text-sm text-foreground/55">
            from <span className="font-serif text-lg font-semibold text-brand-700">{formatNZD(tour.priceFromCents)}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sand-500 px-3.5 py-1.5 text-xs font-semibold text-white transition group-hover:bg-sand-700">
            View dates →
          </span>
        </div>
      </div>
    </Link>
  );
}
