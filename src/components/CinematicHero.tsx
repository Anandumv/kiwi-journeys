"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { SiteSettings } from "@/lib/content";

/** A progressively enhanced hero: content and poster render on the server. */
export function CinematicHero({ settings }: { settings: SiteSettings }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionEnabled(!preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!motionEnabled) return;
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!Number.isFinite(video.duration) || video.seeking) return;
      const rect = section.getBoundingClientRect();
      const distance = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / distance));
      const target = progress * Math.max(0, video.duration - 0.05);
      if (Math.abs(video.currentTime - target) > 0.03) video.currentTime = target;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    video.addEventListener("loadedmetadata", schedule);
    video.addEventListener("seeked", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      video.removeEventListener("loadedmetadata", schedule);
      video.removeEventListener("seeked", schedule);
      video.pause();
    };
  }, [motionEnabled]);

  return (
    <section ref={sectionRef} aria-labelledby="home-title" className="relative -mt-16 min-h-[100svh] bg-brand-950 motion-safe:h-[140svh]">
      <div className="sticky top-0 isolate flex min-h-[100svh] items-center overflow-hidden px-5 pb-16 pt-28 sm:px-8">
        <Image src={settings.heroImage || "/images/brand/Hero-Ocean-Alps.jpg"} alt="" fill priority sizes="100vw" className="-z-30 object-cover" />
        {motionEnabled && (
          <video ref={videoRef} src="/videos/kiwi_mobile.mp4" muted playsInline preload="metadata" aria-hidden="true"
            onLoadedData={() => setVideoReady(true)} onError={() => setVideoReady(false)}
            className={`absolute inset-0 -z-20 h-full w-full object-cover transition-opacity duration-500 ${videoReady ? "opacity-100" : "opacity-0"}`} />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950/85 via-brand-950/45 to-brand-950/15" />
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-2xl text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sand-200 sm:text-sm">{settings.tagline}</p>
            <h1 id="home-title" className="mt-5 font-serif text-5xl font-medium leading-[1.06] tracking-tight sm:text-6xl lg:text-7xl">The South Island, at its own pace</h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">{settings.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/tours" className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-brand-900 transition hover:bg-sand-100">Explore tours <span aria-hidden="true">↗</span></Link>
              <Link href="/private-tours" className="rounded-full border border-white/50 bg-brand-950/20 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15">Plan a private tour</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
