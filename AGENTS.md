<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


## Verified architecture and operating rules (2026-09-10)

- Next.js 16.2.9 uses async route params/cookies. Read installed Next docs before changes. Page modules cannot export arbitrary UI components; put shared admin UI in components/admin.
- Use the Webpack dev/build scripts. The local Turbopack build spawned excessive workers during this audit.
- Reservation creation, booking commit, and rescheduling must share Session inventory locks. Booking commit also locks Reservation; discount resources lock voucher before promo. Preserve this order to avoid deadlocks.
- Never trust a browser discount amount. Contact checkout validates and reserves voucher/promo availability, stores payableCents, and updates the PaymentIntent. The webhook verifies received amount/currency and intent ownership.
- A failed card attempt does not cancel a hold. Partial refunds do not release all seats. Late payments must recheck capacity and require reconciliation when inventory is unavailable.
- Admin, customer, and booking-view JWTs have separate audiences. A short booking reference alone must never reveal passenger details.
- Empty CMS results mean unpublished/empty content. Bundled tour/blog fallback is opt-in via CONTENT_DEMO_MODE=true.
- Integration tests run only against localhost kiwi_journeys_audit_test. Never use seed or destructive verification against an existing operational database. External notification/payment credentials are cleared by the integration runner.
- Production start applies migrations only, never seed. Seed is an explicit bootstrap operation that can overwrite existing data.
- A successful build or health route is not proof of payment/email delivery. Validate external services in test mode before launch; never log or request pasted secrets.
- Verification artifacts and remaining limitations are recorded in outputs/audit/REPORT.md.

- Booking, voucher activation, and full-refund email jobs must be created in the same database transaction as the state change. Payloads and provider idempotency keys are immutable. Do not restore fire-and-forget email sending.
- Email workers use SKIP LOCKED claims and lease tokens, at most eight attempts within 23 hours of the first attempt. Missing configuration preserves attempt counts. Configure deliver-emails every minute; inspect /admin/operations for stopped jobs and payment issues.
- This local PostgreSQL instance uses Asia/Kolkata. Prisma DateTime columns are UTC timestamp-without-timezone: raw SQL comparisons and database defaults for operational jobs must explicitly use `now() AT TIME ZONE 'UTC'`. Comparing against plain NOW() made fresh worker leases appear expired.
- A refund request is not a completed refund. Only a confirmed full charge refund releases seats; partial refunds require review. Retrieve current Stripe charge state when processing delayed payment-success events or retrying paid bookings.

## Deployment shape and scheduling (verified 2026-09-18)

- Production is Railway (project `zealous-rejoicing`, services `kiwi-journeys` + `Postgres`), deployed from `main` with `npm start`, which applies migrations. The `.vercel/` link and `vercel.json` are leftovers from an earlier host; Railway is authoritative. Do not re-add crons to `vercel.json`.
- Railway schedules cron per service, so a single-service deployment has no cron. The jobs run from `src/instrumentation.ts`, which calls the app's own `/api/cron/*` routes over loopback with `CRON_SECRET`, gated on `ENABLE_INTERNAL_CRON=true`. This is only correct at one replica: `deliver-emails` and `expire-holds` are concurrency-safe, the daily notification jobs are not. Move to dedicated cron services before scaling out.
- The app is one long-lived process, not per-request serverless functions. Prisma `connection_limit` must reflect that; a pool of 1 serializes the whole site and lets one slow checkout stall `/api/health` into a restart loop.
- Never hold a pooled connection across an external API call. Compute and persist inside the transaction, then call Stripe after it commits; the webhook's amount check is what makes that ordering safe.
- Missing Stripe/Resend credentials do not crash the app, they silently downgrade it (`/api/reservations` answers 503, email queues but never sends). `register()` logs every missing setting at boot and `/api/health` reports `payments`/`webhook`/`email`/`scheduler` so the degraded state is visible.

## Inventory and capacity

- `POST /api/reservations` is the only unauthenticated endpoint that takes inventory; it holds seats and opens a PaymentIntent, so it must stay rate limited.
- Migration `20260918105325_add_vehicle_fleet` overwrote every `Tour.capacityPerDeparture` with its assigned vehicle's seat count, in both directions, and the original values are gone. `Session.capacity` on already-scheduled departures is the only surviving record of the pre-migration values — `scripts/vehicle-migration-report.mjs` reads it to report what changed. Any future check written against `Tour.capacityPerDeparture` alone compares the new value with itself and reports nothing.
- Bearer values (booking references, gift voucher codes, loyalty promo codes, upload filenames) come from `src/lib/codes.ts`, which uses the OS CSPRNG. Do not reintroduce `Math.random()` for these.
- Stored upload extensions are derived from the validated MIME type, never from the client-supplied filename.

## Whole-site review (2026-09-23)

- Next.js is now pinned to 16.3.6 after the dependency audit found image-optimizer and other advisories in 16.2.9. Keep Webpack builds and consult the installed docs. Three high audit entries remain in the Prisma CLI → @prisma/config → deepmerge-ts chain; do not use `npm audit fix --force`, which proposes downgrading Prisma to 6.12.0.
- Tour filters derive from `useSearchParams`; native history replacement keeps filtering client-side and preserves browser back/forward navigation. Treat incoming filter values as untrusted; unknown price bands fall back to all prices.
- Sold-out dates remain selectable when a real tour ID exists. The customer chooses a specific departure before joining its waitlist, and the API validates that departure belongs to the active tour and is in the future.
- Waitlist notification availability subtracts active, unexpired reservation `seats` as well as confirmed bookings. Only a provider response with an accepted message ID may mark an entry notified. This job still relies on the existing single-replica scheduler and is not a transactional outbox.
- Reveal wrappers must render visible server HTML and honor reduced motion without hydration. The hero video is requested on scrolling, preserving the initial poster load.
- Keep the public loading placeholder at least a viewport tall: a half-height placeholder exposed the footer before streamed content arrived, causing measured CLS 0.305. The full-viewport placeholder measured CLS 0 in the follow-up lab run.
- The existing cancellation terms and FAQ require more than 72 hours for a full refund; promotional copy must not promise 48 hours.
- `scripts/audit-browser.mjs` runs only against localhost, intercepts waitlist writes, and saves screenshots plus axe results under `outputs/audit/2026-09-23`. Audit-only Playwright/axe dependencies can be installed outside the project via `AUDIT_TOOLS`; no real messages or payments are needed for these checks.
- Full review and launch limitations: `docs/audits/2026-09-23.md`. Live Railway health reported missing payment, webhook, and email configuration during this review; local tests are not proof of provider delivery.
- Design direction: the user explicitly rejects a generic AI-generated appearance. Favor real CMS tour photography, open listings, practical copy, and restrained ruled sections. Avoid decorative blobs, excessive pill badges, rounded testimonial cards, invented proof, and repeated promotional color bands. Preserve brand assets and booking clarity; category imagery should come from a published tour in that category when available.

- The user selected https://travelnextlvl.de/en as the primary visual reference on 2026-09-23. The homepage now uses Barlow Condensed for its cinematic hero, existing CMS photography/video, and a field-guide tour index. Keep homepage styles in HomeEditorial.module.css so they do not leak into checkout/admin. Retain the server-rendered booking links, deferred video, reduced-motion behavior, and newsletter form. The Node hero SSR test stubs CSS-module loading; the production build verifies actual styles.

- The homepage carriage-window reveal is driven by one normalized `--journey-progress` value on the hero. Keep its frame geometry independent of video loading, retain the poster on failure, and reset progress to zero for reduced motion. `scripts/audit-window.mjs` verifies viewport expansion and reduced motion at 390/1440px without external writes.

- The user replaced the postcard concept with a carriage window: upright rounded metallic surround, subtle glass reflection, understated adjacent headline. Frame, reflection and radius recede with scroll; do not imply that the operator sells rail tours.

- Window-scene choices derive only from published tours passed by the homepage. Keep each image paired with its actual tour URL and expose selection with aria-pressed. Rebind video listeners when returning to the first view after another scene has unmounted the video.

- The user rejected a floating window over a dark gradient. The opening must read as a carriage interior: warm panelled wall, recessed frame, sill and restrained seat edge. Solid navigation remains legible over both wall and expanded scenery; preserve the reduced-motion static interior.

- Explicit window-scene selection disables the introductory video so it cannot overwrite the selected photo. Reveal progress uses the actual sticky frame height, not the viewport height, because short phones need a taller readable scene. Keep scene controls below the glass and validate 375×667 as well as larger screens.

- The carriage backdrop is a generated interior material study (`public/images/brand/carriage-interior.webp`), not an operator vehicle photograph. Keep actual published destination photography in the separate interactive window. Desktop copy must stay above the seat/timber region; mobile uses a light lower fade for contrast.

## Functional CMS review (2026-09-25)

- The operator offers same-day outings, including half-day products. Do not reintroduce multi-day promotions or overnight-only Tekapo stargazing upgrades. Preserve accurate half-day durations. The explicit local content correction is `scripts/correct-day-trip-content.mjs`; it backs up data and refuses changes when affected bookings/holds exist.
- CMS tour and price edits must use one transaction. Booked price options cannot be deleted; surface the error and preserve the whole prior tour. Settings JSON must validate syntax and structure on the server before any write; never silently replace malformed JSON with empty arrays/objects.
- Admin media and promo-code lists need fixtures with records in browser tests. Event handlers in their server components were hidden by empty-state testing; use client components for input selection and deletion confirmation.
- Next's production public-file manifest does not automatically expose newly written uploads. `/uploads/[filename]` serves validated image filenames immediately; this does not provide persistent storage across Railway redeploys.
- Operator departure cancellation uses `cancelDeparture`: lock Session, update status and enqueue deduplicated notices atomically. It does not issue refunds. Never promise a completed or automatically initiated refund in that notice.
- `scripts/audit-cms.mjs` runs actual CMS mutations only against localhost `kiwi_journeys_audit_test`, starts port 3102, clears provider/storage credentials and disables the scheduler. Coverage and remaining provider requirements: `docs/audits/2026-09-25-functional-cms.md`.

## Public page design direction (2026-09-25)

- The other public pages now share `PageHero.module.css`: light split layout, condensed type, local landscape image, restrained caption. Avoid returning to dark green gradient banners and large white serif titles on every page. Different pages should use relevant existing or published-tour imagery, not the same Tekapo photo everywhere.
- Keep destination, FAQ, journal, contact, voucher and private-tour content in open ruled layouts rather than repeated rounded card shells. Preserve clear cards/controls where an actual booking, checkout or account task needs grouping.
- `scripts/audit-pages-visual.mjs` captures 17 representative routes at 390/1440px and checks status, one H1 and horizontal overflow. A full-page screenshot may show unloaded lazy images below the viewport; scroll to verify a specific image before reporting it broken.
- Tour detail must not promise 48-hour full refunds; existing terms require more than 72 hours. Vehicle capacities vary by departure, so do not promise a universal 16-guest maximum. Avoid unverified stars, guaranteed port return and instant provider confirmation copy.

## Site-wide design system pass (2026-09-25)

- One type system: Barlow Condensed (`--font-display`) for page/section titles and big numerals, Geist for everything else. Fraunces is no longer loaded; the `font-serif` utility is kept across 45 files but `--font-serif` now resolves to Geist. Do not reintroduce a serif.
- Controls are near-square: `--radius-lg/xl/2xl` tokens are 2–4px and `a/button/input.rounded-full` is overridden to 2px in globals.css. `rounded-full` on spans (dots, step markers) stays round. `--color-brand-600/700` are the homepage ink greens (#203c33 / #315445 hover).
- Tour detail uses `components/TourDetail.module.css`: split hero (copy + full-height `Gallery`), numbered ruled sections, sticky ruled booking panel, mobile price bar. `Gallery` now fills its parent; give it a sized container.
- Long-form pages (About, Sustainability) use `EditorialSection` + `editorial.wrap/prose/list/figures`. Prefer it over new `max-w-3xl` article blocks.
- Every `PageHero` takes a distinct high-resolution published-tour photo plus an accurate `caption`. Several `/images/general/*` files are 387–445px wide and look soft as heroes; use `/images/tours/*` originals (1900px+). Verify the photo before captioning it — filenames are opaque Wix hashes.
- The carriage backdrop's timber post occupies the left ~5% of the image; desktop hero copy is offset past it.
- The footer has no top margin and opens with a condensed "Pick a day" sign-off band; pages supply their own bottom padding.
- The desktop header hides the CMS nav's "/" item (the logo is home). Nav contents and About stats (`≤16 guests`, `100%`, `365`) are CMS data, not code; the `≤16` stat conflicts with the vehicle-capacity rule above and needs the owner to change it in admin.
- Homepage testimonials no longer render star glyphs.
- Next 16 streams page metadata to non-bot user agents, so curl/Lighthouse see no `<meta name="description">` on dynamic pages while Googlebot gets it in the head. Lighthouse's SEO 92 on tour detail is this artifact, not missing metadata.
- Restarting the preview: the process title is `next-server`, so `pkill -f "next start"` misses it and a stale server keeps serving a rebuilt `.next` without CSS. Kill by port (`lsof -tiTCP:3101 -sTCP:LISTEN | xargs kill`).
- `scripts/audit-pages-visual.mjs` accepts `AUDIT_OUT`. Record: `docs/audits/2026-09-25-design-system.md`.
- Short task pages (account login, booking lookup, voucher success, 404) use `components/TaskShell.tsx`. The root `app/not-found.tsx` wraps the public 404 in the public layout so unknown URLs keep the header and footer; `audit-cms.mjs` asserts the 404 heading "Off the map".
- The booking page is a two-step layout (01 Date, 02 Time & guests) with a summary strip. Scarcity copy is factual ("3 seats left"), never exclamatory.
- On public pages, muted text is `text-foreground/75` minimum and green text is `brand-700`; lighter values failed axe contrast. macOS `sed` ignores `\b`, so use `perl -pi` for word-boundary codemods.
- Local `.env` Stripe/Resend values are placeholders. The booking widget is verified up to the reservation request (intercepted); a real test-mode payment needs real Stripe test keys.
- Motion layer: `globals.css` defines `.sd-clip`, `.sd-rise` and `.sd-rule`, pure-CSS scroll-driven animations inside `@supports (animation-timeline: view())` plus `prefers-reduced-motion: no-preference`. They animate transform/clip-path only, never opacity, so content stays visible without support. Don't animate `img` transform inside `.sd-clip`: it overrides the card hover zoom.
- Route transitions use React `<ViewTransition>`: the public `<main>` has `default="page-fade"`, and tour photos share `name="tour-photo-{slug}"` (`share="morph"`) between `TourCard` and the tour detail media. Names must stay unique per page.
- Homepage destinations are `components/DestinationDirectory.tsx` (client): the photo follows hover/focus, and server HTML shows the first place.
- The homepage LCP is the window hero photo (`fetchPriority="high"`, mobile `sizes` 92vw). Unthrottled render is ~0.5s; Lighthouse's simulated mobile LCP stays ~4s because of the hero photo plus the carriage backdrop.
- Phone performance: `app/icon.png` must stay tiny (it was 67KB, now 2.8KB PNG8), because it loads before LCP. Phones get `carriage-interior-900.webp` (14KB) via the mobile media query; desktop gets the q64 1536px WebP (52KB). The original 100KB backdrop is in commit 898b241 if higher quality is needed. Three Lighthouse mobile runs after this: 92–93 performance, LCP 3.2–3.4s.
