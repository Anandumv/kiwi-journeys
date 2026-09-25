import Link from "next/link";
import { ViewTransition } from "react";
import Image from "next/image";
import { type Tour } from "@/data/tours";
import { formatNZD } from "@/lib/money";

export function TourCard({ tour }: { tour: Tour }) {
  return (
    <Link href={`/tours/${tour.slug}`} className="group flex h-full flex-col">
      <ViewTransition name={`tour-photo-${tour.slug}`} share="morph">
      <div className="sd-clip relative aspect-[4/3] overflow-hidden bg-[#c9cfc4]">
        <Image
          src={tour.heroImage}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] motion-safe:group-hover:scale-[1.04]"
        />
      </div>
      </ViewTransition>
      <div className="flex flex-1 flex-col border-b border-[#202b2626] pb-5 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[.13em] text-foreground/65">
          {tour.durationLabel} <span aria-hidden="true">/</span> {tour.destination}
        </p>
        <h3 className="mt-2 text-[22px] font-medium leading-tight tracking-[-.02em] text-foreground underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-current">
          {tour.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-foreground/75">{tour.summary}</p>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-sm text-foreground/65">
            From <span className="font-[family-name:var(--font-display)] text-[28px] font-medium leading-none tabular-nums text-foreground">{formatNZD(tour.priceFromCents)}</span>
          </span>
          <span aria-hidden="true" className="text-lg transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
        </div>
      </div>
    </Link>
  );
}
