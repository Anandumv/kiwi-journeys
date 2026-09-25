"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { SiteSettings } from "@/lib/content";
import styles from "./HomeEditorial.module.css";

/** A progressively enhanced hero: content and poster render on the server. */
type WindowView = { label: string; image: string; href: string };
export function CinematicHero({ settings, views = [] }: { settings: SiteSettings; views?: WindowView[] }) {
  const [selectedView, setSelectedView] = useState(0);
  const view = views[selectedView];
  const [hasChosenView, setHasChosenView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoRequested, setVideoRequested] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionEnabled(!preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (!motionEnabled) {
      section.style.setProperty("--journey-progress", "0");
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const distance = Math.max(1, rect.height - (section.firstElementChild?.getBoundingClientRect().height ?? window.innerHeight));
      const progress = Math.min(1, Math.max(0, -rect.top / distance));
      section.style.setProperty("--journey-progress", String(progress));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [motionEnabled]);

  useEffect(() => {
    if (!motionEnabled || videoRequested) return;
    const requestVideo = () => {
      const rect = sectionRef.current?.getBoundingClientRect();
      if (window.scrollY > 0 && rect && rect.bottom > 0) setVideoRequested(true);
    };
    requestVideo();
    window.addEventListener("scroll", requestVideo, { passive: true });
    return () => window.removeEventListener("scroll", requestVideo);
  }, [motionEnabled, videoRequested]);

  useEffect(() => {
    if (!motionEnabled || !videoRequested || selectedView !== 0 || hasChosenView) return;
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!Number.isFinite(video.duration) || video.seeking) return;
      const rect = section.getBoundingClientRect();
      const distance = Math.max(1, rect.height - (section.firstElementChild?.getBoundingClientRect().height ?? window.innerHeight));
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
  }, [motionEnabled, videoRequested, selectedView, hasChosenView]);

  return (
    <section ref={sectionRef} aria-labelledby="home-title" className={styles.hero}>
      <div className={styles.heroFrame}>
        <div className={styles.carriageWindow} aria-hidden="true">
          <div className={styles.carriageView}>
        <Image src={view?.image || settings.heroImage || "/images/brand/Hero-Ocean-Alps.jpg"} alt="" fill priority sizes="100vw" className={styles.heroPhoto} />
        {motionEnabled && videoRequested && selectedView === 0 && !hasChosenView && (
          <video ref={videoRef} src="/videos/kiwi_mobile.mp4" muted playsInline preload="metadata" aria-hidden="true"
            onLoadedData={() => setVideoReady(true)} onError={() => setVideoReady(false)}
            className={`${styles.heroVideo} ${videoReady ? styles.videoReady : ""}`} />
        )}
          </div>
        </div>
        <div className={styles.heroShade} />
        {views.length > 1 && <div className={styles.windowControls}>
          <p>Choose your view</p>
          <div role="group" aria-label="Landscape view">
            {views.map((item, index) => <button key={item.label} type="button" aria-pressed={selectedView === index} onClick={() => { setSelectedView(index); setHasChosenView(true); }}>{item.label}</button>)}
          </div>
          <Link href={view.href}>Explore this day out <span aria-hidden="true">↗</span></Link>
        </div>}
        <div className={styles.scrollCue} aria-hidden="true"><span />Scroll into the landscape</div>
        <div className={styles.heroTopline}>
          <p>New Zealand / Small-group journeys</p>
          <Link href="/private-tours">Private journeys ↗</Link>
        </div>
        <div className={styles.heroContent}>
          <p className={styles.heroIntro}>South Island day tours & private day trips</p>
          <h1 id="home-title" className={styles.heroTitle}>Take the<br /><span>window seat.</span></h1>
          <div className={styles.heroBottom}>
            <p>Coastal roads, alpine towns and days on the water.<br />Come see our part of New Zealand.</p>
            <Link href="/tours" className={styles.heroCta}>Find your day out <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
