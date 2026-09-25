# Site-wide design system pass — 25 September 2026

## Audit findings (before)

1. Tour detail, the main conversion page, still used the pre-editorial template: mint title band, green numbered circles, serif headings, rounded widget with card-brand badges.
2. Three competing type systems (Barlow Condensed, Fraunces serif, Geist) and two button shapes (pills and square).
3. Every inner page used the same split hero, several with the same photographs; Contact, Sustainability, FAQ, About, Journal and Vouchers used 387–445px images that rendered soft.
4. Homepage desktop hero copy sat on the backdrop's timber post, so the first letters collided with the wood.
5. Journal index grid placed excerpts in the 130px date column.
6. A 96px empty band sat between every page and the footer.
7. Unverified star glyphs on homepage testimonials.

## Changes

- Unified type (display + Geist) and square control shapes through theme tokens; primary green unified with the homepage ink green.
- Rebuilt tour detail: split hero with full-height gallery, key facts, numbered ruled sections (highlights, the day, included, good to know), sticky ruled booking panel, related tours, mobile price bar. JSON-LD unchanged.
- Restyled tour cards and filters (underlined search, ruled count, square controls).
- Distinct, high-resolution, correctly captioned published-tour photography on ten page heroes; transform-only entrance motion with reduced-motion fallback.
- Journal index and FAQ (sticky topic index, condensed category headings) rebuilt; About and Sustainability use shared numbered editorial sections.
- Header: ink CTA, active underline, full-screen condensed mobile menu with call link. Footer: sign-off band, no stray gap.

## Verification

- Production Webpack build, typecheck, 58/58 unit tests.
- `audit-browser.mjs`: 21/21 (includes 11 axe scans). Additional axe WCAG 2.2 AA scan of 7 redesigned routes at 390 and 1440px: 0 violations after fixing two contrast issues and an unlabelled currency select found during this pass.
- `audit-window.mjs`: expansion and reduced motion pass at 375/390/1440.
- `audit-pages-visual.mjs`: 34 captures, all HTTP 200, one H1, no horizontal overflow.
- Lighthouse mobile (local lab, single runs): home 88/100/100/100, LCP 4.0s, CLS 0; tour detail 92/100/100/92, LCP 3.4s, CLS 0. The SEO 92 is Next 16 streamed metadata (Googlebot receives the description in the head).
- Screenshots: `outputs/audit/2026-09-25-award/` (`before/`, `r5/`).

## Not done / needs owner

- About stats and nav items are CMS data; `≤16 guests per departure` conflicts with variable vehicle capacity.
- Photo rights for tour imagery; home LCP (hero image/video) still above 2.5s in lab.
- Not deployed; live payments/email remain unconfigured per earlier audits.

## Second pass: remaining pages and functionality

The booking page was rebuilt into two steps with a flat, ruled calendar and guest controls. Login, booking lookup, voucher success and 404 now share `TaskShell`, and unknown URLs render with the site header and footer. A contrast/ruled-style codemod covered 34 public pages and forms.

Verification: build and typecheck pass. Unit tests 58/58, integration tests 20/20 and CMS checks 34/34 pass; HTTP checks 37/37, browser checks 21/21 and hero window checks pass. Axe WCAG 2.2 AA on 23 routes × 2 widths (46 scans) found 0 violations. A scripted booking flow at 390 and 1440 computed the correct total, sent a well-formed reservation request (intercepted) and surfaced the payment-unavailable error with no page errors.

Not verifiable here: live card payment, webhook and email delivery. Production health reports payments/webhook/email false until the owner configures Stripe and Resend in Railway.
