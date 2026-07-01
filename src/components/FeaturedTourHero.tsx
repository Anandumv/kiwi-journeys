"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { Tour } from "@/data/tours";
import type { SiteSettings } from "@/lib/content";
import { formatNZD } from "@/lib/money";

type FeaturedTourHeroProps = {
  featuredTours: Tour[];
  settings: SiteSettings;
};

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD_PX = 48;

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
}

function isValidPrice(cents: number) {
  return Number.isFinite(cents) && cents > 0;
}

export function FeaturedTourHero({ featuredTours, settings }: FeaturedTourHeroProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const tours = useMemo(() => featuredTours.slice(0, 6), [featuredTours]);
  const hasCarousel = tours.length >= 2;
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const pointerStartX = useRef<number | null>(null);

  const activeTour = tours[activeIndex];

  useEffect(() => {
    if (!hasCarousel || hasInteracted || prefersReducedMotion) return;

    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % tours.length);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(id);
  }, [hasCarousel, hasInteracted, prefersReducedMotion, tours.length]);

  function moveTo(index: number) {
    setHasInteracted(true);
    setActiveIndex((index + tours.length) % tours.length);
  }

  function moveBy(delta: number) {
    moveTo(activeIndex + delta);
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (!hasCarousel) return;
    pointerStartX.current = event.clientX;
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    if (!hasCarousel || pointerStartX.current === null) return;

    const distance = event.clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(distance) < SWIPE_THRESHOLD_PX) return;
    moveBy(distance > 0 ? -1 : 1);
  }

  if (!hasCarousel || !activeTour) {
    return (
      <section className="relative isolate -mt-16 flex min-h-[88vh] items-center overflow-hidden sm:min-h-[92vh]">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image src={settings.heroImage} alt="" fill priority sizes="100vw" className="animate-kenburns object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950/90 via-brand-950/65 to-brand-950/30" />
        <div className="mx-auto w-full max-w-7xl px-5 pt-20 sm:px-6">
          <p className="eyebrow text-sand-400">{settings.tagline}</p>
          <h1 className="mt-4 max-w-3xl font-serif text-[2.5rem] font-semibold leading-[1.08] text-white text-balance sm:mt-5 sm:text-6xl sm:leading-[1.05] lg:text-7xl">
            The South Island, at its own pace
          </h1>
          <p className="mt-5 max-w-xl text-base text-brand-100/90 sm:text-lg">{settings.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link href="/tours" className="rounded-full bg-sand-500 px-7 py-3.5 text-center font-semibold text-brand-950 transition hover:bg-sand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950">
              Explore Tours
            </Link>
            <Link href="/contact" className="rounded-full border border-white/40 px-7 py-3.5 text-center font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950">
              Plan a Private Tour
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const showPrice = isValidPrice(activeTour.priceFromCents);

  return (
    <section
      className="relative isolate -mt-16 flex min-h-[88vh] items-center overflow-hidden sm:min-h-[92vh]"
      aria-label="Featured tours"
      aria-roledescription="carousel"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        pointerStartX.current = null;
      }}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {tours.map((tour, index) => {
          const isActive = index === activeIndex;
          return (
            <Image
              key={tour.slug}
              src={tour.heroImage || settings.heroImage}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              className={`object-cover transition-opacity duration-700 ${
                isActive ? "opacity-100" : "opacity-0"
              } ${isActive && !prefersReducedMotion ? "animate-kenburns" : ""}`}
              aria-hidden={!isActive}
            />
          );
        })}
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950/92 via-brand-950/68 to-brand-950/30" />
      <div className="mx-auto w-full max-w-7xl px-5 pt-20 sm:px-6">
        <div className="max-w-3xl">
          <p className="eyebrow text-sand-400">{settings.tagline}</p>
          <h1 className="mt-4 font-serif text-[2.45rem] font-semibold leading-[1.08] text-white text-balance sm:mt-5 sm:text-6xl sm:leading-[1.05] lg:text-7xl">
            {activeTour.title}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-white/85">
            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur-sm">{activeTour.destination}</span>
            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur-sm">{activeTour.durationLabel}</span>
            {showPrice && (
              <span className="rounded-full border border-sand-400/50 bg-sand-500/20 px-3 py-1.5 text-sand-200 backdrop-blur-sm">
                From {formatNZD(activeTour.priceFromCents)}
              </span>
            )}
          </div>
          <p className="mt-5 max-w-xl text-base text-brand-100/90 sm:text-lg">{activeTour.summary}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link href={`/tours/${activeTour.slug}`} className="rounded-full bg-sand-500 px-7 py-3.5 text-center font-semibold text-brand-950 transition hover:bg-sand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950">
              View dates
            </Link>
            <Link href="/tours" className="rounded-full border border-white/40 px-7 py-3.5 text-center font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950">
              Explore all tours
            </Link>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-4">
          <div className="flex gap-2" aria-label="Choose featured tour slide">
            {tours.map((tour, index) => (
              <button
                key={tour.slug}
                type="button"
                aria-label={`Show ${tour.title}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => moveTo(index)}
                className={`h-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950 ${
                  index === activeIndex ? "w-9 bg-sand-400" : "w-2.5 bg-white/45 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
          <div className="ml-auto hidden gap-2 sm:flex">
            <button
              type="button"
              aria-label="Previous featured tour"
              onClick={() => moveBy(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-2xl leading-none text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950"
            >
              <span aria-hidden="true">&lt;</span>
            </button>
            <button
              type="button"
              aria-label="Next featured tour"
              onClick={() => moveBy(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-2xl leading-none text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950"
            >
              <span aria-hidden="true">&gt;</span>
            </button>
          </div>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        Showing {activeTour.title}
      </span>
    </section>
  );
}
