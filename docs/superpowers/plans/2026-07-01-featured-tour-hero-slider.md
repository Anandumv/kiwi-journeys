# Featured Tour Hero Slider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static homepage hero with a CMS-driven featured-tour hero carousel that keeps the rest of the homepage intact.

**Architecture:** Keep `src/app/(public)/page.tsx` as a Server Component that fetches content and passes serializable props into a focused Client Component. Put all carousel state, timers, keyboard/pointer handling, and reduced-motion checks in `src/components/FeaturedTourHero.tsx`. Do not add CMS schema fields or third-party carousel dependencies.

**Tech Stack:** Next.js `16.2.9` App Router, React `19.2.4`, TypeScript, Tailwind CSS `4`, `next/image`, existing `framer-motion` dependency only if needed.

## Global Constraints

- Read relevant docs under `node_modules/next/dist/docs/` before coding because this repo states: "This is NOT the Next.js you know".
- Pages and layouts are Server Components by default; use a Client Component only where state, effects, event handlers, or browser APIs are required.
- Props passed from Server Components to Client Components must be serializable.
- Use `next/image` for hero images.
- Use featured tours from `getTours()`, filtered by `tour.featured`, with a maximum of 6 slides.
- If fewer than 2 featured tours are available, render a static hero without carousel controls.
- If a tour image is missing, use `settings.heroImage`.
- Primary CTA must link to `/tours/${tour.slug}`.
- Secondary CTA must link to `/tours`.
- Auto-advance every 6 seconds and pause after user interaction.
- Respect `prefers-reduced-motion` by disabling auto-advance and heavy image movement.
- No new CMS schema fields.
- No new third-party carousel dependency.
- Keep the pre-existing `.claude/settings.json` modification untouched.

---

## File Structure

- Create `src/components/FeaturedTourHero.tsx`: client-only hero carousel. Owns active slide state, auto-advance, controls, swipe/drag, keyboard handling, reduced-motion behavior, static fallback, image fallback, and all hero markup.
- Modify `src/app/(public)/page.tsx`: import `FeaturedTourHero`, remove the inline static hero section, and render the new component with `featuredTours={featured}` and `settings={s}`.
- No schema, admin, API, data getter, or CSS file changes are required unless implementation reveals a compile issue.

---

### Task 1: Add The FeaturedTourHero Component

**Files:**
- Create: `src/components/FeaturedTourHero.tsx`

**Interfaces:**
- Consumes:
  - `Tour` from `@/data/tours`
  - `SiteSettings` from `@/lib/content`
  - `formatNZD(cents: number): string` from `@/lib/money`
- Produces:
  - `FeaturedTourHero({ featuredTours, settings }: { featuredTours: Tour[]; settings: SiteSettings }): JSX.Element`

- [ ] **Step 1: Read the local Next docs for this task**

Run:

```bash
sed -n '1,220p' node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md
sed -n '1,180p' node_modules/next/dist/docs/01-app/01-getting-started/12-images.md
sed -n '1,140p' node_modules/next/dist/docs/03-architecture/accessibility.md
```

Expected: docs confirm that interactivity belongs in a Client Component, Server Components can pass serializable props, and `next/image` is the correct image component.

- [ ] **Step 2: Write the component**

Create `src/components/FeaturedTourHero.tsx` with this content:

```tsx
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
      aria-roledescription={hasCarousel ? "carousel" : undefined}
      aria-label={hasCarousel ? "Featured tours" : undefined}
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

        {hasCarousel && (
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
        )}
      </div>
      <span className="sr-only" aria-live="polite">
        {hasCarousel ? `Showing ${activeTour.title}` : ""}
      </span>
    </section>
  );
}
```

- [ ] **Step 3: Run build verification for the standalone component**

Run:

```bash
npm run build
```

Expected: build may still pass because the component is not imported yet. If it fails, the failure should point to a syntax or type error in `src/components/FeaturedTourHero.tsx`; fix that exact error before moving on.

- [ ] **Step 4: Commit**

Run:

```bash
git add src/components/FeaturedTourHero.tsx
git commit -m "feat: add featured tour hero component"
```

Expected: commit succeeds with only `src/components/FeaturedTourHero.tsx` staged.

---

### Task 2: Replace The Inline Homepage Hero

**Files:**
- Modify: `src/app/(public)/page.tsx`

**Interfaces:**
- Consumes: `FeaturedTourHero` from `@/components/FeaturedTourHero`
- Produces: homepage renders `<FeaturedTourHero featuredTours={featured} settings={s} />` before the trust strip

- [ ] **Step 1: Write the integration change**

In `src/app/(public)/page.tsx`, add the import:

```tsx
import { FeaturedTourHero } from "@/components/FeaturedTourHero";
```

Then replace the entire inline hero section, starting at:

```tsx
      {/* Hero */}
      <section className="relative isolate -mt-16 flex min-h-[88vh] items-center overflow-hidden sm:min-h-[92vh]">
```

and ending at the matching closing `</section>` before `{/* Trust strip */}`, with:

```tsx
      <FeaturedTourHero featuredTours={featured} settings={s} />
```

- [ ] **Step 2: Run build to verify integration**

Run:

```bash
npm run build
```

Expected: PASS. If it fails because `FeaturedTourHero` props are not serializable, remove any non-serializable values from props rather than moving data fetching into the client component.

- [ ] **Step 3: Check the resulting homepage diff**

Run:

```bash
git diff -- 'src/app/(public)/page.tsx'
```

Expected: the diff imports `FeaturedTourHero` and replaces only the old hero section. The trust strip and all lower homepage sections remain unchanged.

- [ ] **Step 4: Commit**

Run:

```bash
git add 'src/app/(public)/page.tsx'
git commit -m "feat: use featured tour hero on homepage"
```

Expected: commit succeeds with only `src/app/(public)/page.tsx` staged.

---

### Task 3: Browser Verification And Polish

**Files:**
- Modify if needed: `src/components/FeaturedTourHero.tsx`
- Modify if needed: `src/app/(public)/page.tsx`

**Interfaces:**
- Consumes: completed component and homepage integration from Tasks 1-2
- Produces: verified desktop and mobile hero behavior

- [ ] **Step 1: Start the local dev server**

Run:

```bash
npm run dev
```

Expected: Next dev server starts and prints a localhost URL, usually `http://localhost:3000`.

- [ ] **Step 2: Verify desktop behavior**

Open the homepage at the dev server URL and check:

```text
Desktop viewport:
- Hero fills the first viewport.
- Slide text is readable against every image.
- "View dates" goes to /tours/<slug>.
- "Explore all tours" goes to /tours.
- Dot controls change slides.
- Arrow controls change slides.
- Trust strip remains directly below the hero.
- No text overlaps controls.
```

- [ ] **Step 3: Verify mobile behavior**

Use a mobile-width viewport and check:

```text
Mobile viewport:
- Hero headline, metadata, summary, and buttons fit without horizontal scrolling.
- Swipe left/right changes slides.
- Dot controls are tappable.
- Desktop arrows are hidden.
- Trust strip remains visible after the hero.
```

- [ ] **Step 4: Verify reduced-motion behavior**

Enable reduced motion in the browser or OS and check:

```text
Reduced motion:
- Slides do not auto-advance.
- Ken Burns image motion does not run.
- Manual controls still work.
```

- [ ] **Step 5: Apply minimal polish only if verification finds a concrete issue**

If text overlaps controls, adjust spacing in `src/components/FeaturedTourHero.tsx` by changing:

```tsx
<div className="mt-10 flex items-center gap-4">
```

to:

```tsx
<div className="mt-8 flex items-center gap-4 pb-4 sm:mt-10 sm:pb-0">
```

If mobile text is too large, adjust the `h1` class from:

```tsx
text-[2.45rem]
```

to:

```tsx
text-[2.25rem]
```

Do not make unrelated visual changes.

- [ ] **Step 6: Run final build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit any polish changes**

If Task 3 changed files, run:

```bash
git add src/components/FeaturedTourHero.tsx 'src/app/(public)/page.tsx'
git commit -m "fix: polish featured tour hero responsiveness"
```

Expected: commit succeeds only if verification-driven polish changes exist. If no files changed, skip this commit.

---

### Task 4: Final Status Check

**Files:**
- No file changes expected

**Interfaces:**
- Consumes: completed commits from Tasks 1-3
- Produces: clean summary of implementation and known repo status

- [ ] **Step 1: Check git status**

Run:

```bash
git status --short --branch
```

Expected: branch may be ahead of remote. `.claude/settings.json` may still appear modified because it existed before this work and must remain untouched.

- [ ] **Step 2: Check recent commits**

Run:

```bash
git log --oneline -5
```

Expected: recent commits include the design spec commit plus the hero component/homepage implementation commits.

- [ ] **Step 3: Report completion**

Report:

```text
Implemented the featured-tour hero slider.
Verified with npm run build and browser checks.
Left the pre-existing .claude/settings.json modification untouched.
```
