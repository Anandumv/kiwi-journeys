# Day-trip content and functional/CMS audit — 25 September 2026

## Result

Changes are local, not deployed. The catalogue consists of same-day trips: nine full-day entries and three shorter half-day entries. The shorter durations were preserved. This review exercises the flows below; it does not establish that every possible production failure is absent.

## Corrections

- Replaced multi-day promotional copy in defaults and seed source with same-day wording. Updated the local CMS's exact legacy tagline, footer tagline and multi-day value proposition without reseeding.
- Removed four overnight-only Tekapo stargazing/observatory price options from bundled content and the local CMS. The correction checked for booking references and current holds first; neither existed. A timestamped content backup is under `outputs/audit/2026-09-25/`. `scripts/correct-day-trip-content.mjs` is local-only, defaults to a dry run, and requires `--apply` to change content. No production data was edited.
- Tour edits and price replacement now commit atomically. Invalid or duplicate price keys, negative/invalid prices, invalid seat counts, missing titles, malformed slugs and durations outside a single day are rejected. Validation, duplicate-slug and referenced-price errors are visible in the editor. A failed price deletion cannot partially update a tour.
- Settings JSON is validated on the server for syntax and structure, including navigation URL schemes. Invalid JSON previously silently overwrote data with empty values. The form now presents errors without writing settings. Removed the fragile inline submit script.
- Media and promo-code pages contained client event handlers inside server components. They only failed once records existed. Moved those interactions into client components.
- Local uploads returned success but their URLs returned 404 when created after the production server started. Added a constrained image-only runtime route with filename validation, explicit MIME types and `nosniff`. New uploads now resolve immediately. Upload errors are visible in image editors and the media library.
- Booking CSV export neutralizes spreadsheet formulas in customer-controlled fields while preserving quoted text.
- Admin login handles network failure, limits post-login navigation to admin paths and labels its credential fields.
- Departure cancellation previously sent emails directly, lost notifications when email was unconfigured, and promised refunds without issuing them. Cancellation now locks the session and records immutable, deduplicated notification jobs in the same database transaction. The message explicitly states that a refund still needs to be arranged. This does not issue refunds or mark paid bookings refunded; that remains a separate action and confirmation workflow.

## Verification

| Check | Result | Scope |
| --- | --- | --- |
| Production Webpack build / TypeScript | Pass | Application compiles; final import/format cleanup typechecked |
| Unit/regression tests | 58 passed | Auth, checkout, refunds, content, vehicles, waitlist, rendering and new CMS validation |
| Isolated PostgreSQL integration | 20 passed | Last-seat contention, duplicate payment events, late payment conflicts, amount/ownership checks, discounts, rescheduling, refund and voucher state, email retry/leases, vehicle scheduling, cancellation atomicity/idempotency |
| Authenticated CMS browser audit | 34 passed | Actual login, 17 admin screens, tour creation/editing/unpublishing, invalid-save preservation, booked-price transaction rollback, settings validation/saving, destination/blog/testimonial CRUD, CSV export, media with existing records, rejected non-image upload, successful image upload/readback, one-off departure creation/cancellation, promo creation/edit/deletion |
| Public browser audit | 21 passed | Filtering/history, waitlist UI with intercepted write, keyboard menu behavior, responsive layout, 11 automated accessibility scans and no-JavaScript content |
| HTTP audit | 37 passed | Sitemap pages, health, authorization redirects and not-found behavior |
| Window interaction | 3 sizes passed | 375×667, 390×900, 1440×900; selection, expansion, reduced motion and mobile overlap |

CMS mutations ran only against localhost `kiwi_journeys_audit_test`, using a generated disposable admin. Payment, messaging and Blob credentials were cleared, the scheduler was disabled, and uploaded test files were removed. Ordinary public browser tests did not submit real customer requests. The local catalogue correction above was a separate authorized content edit, with a backup, not test fixture seeding.

Artifacts: `outputs/audit/2026-09-25/`. Public browser screenshots/JSON retain the existing script's `outputs/audit/2026-09-23/` destination; HTTP JSON is `outputs/audit/http-routes.json`. CMS screenshot: `outputs/audit/2026-09-25/cms-tours.png`.

## Remaining production requirements and boundaries

1. A fresh read-only Railway health check returned `status: ok-degraded`, `db: ok`, `payments: false`, `webhook: false`, `email: false`, `scheduler: true`. Configure the existing deployment's Stripe, webhook and email settings before claiming booking readiness. No secrets were printed or requested.
2. Real Stripe/3DS, provider retries, actual refunds, customer magic-link delivery, voucher delivery, contact/private-tour messages, campaign delivery and scheduled notifications have not been verified end to end with live providers. The integration suite verifies local state transitions and simulated delivery, not provider acceptance.
3. Railway media persistence across redeploys needs durable Blob storage or a persistent volume. The runtime route fixes immediate readback, not ephemeral filesystem durability. External storage credentials were deliberately disabled for tests.
4. Cancelling a departure does not process a refund. Operators must arrange refunds or alternatives separately. The updated notification now reflects that fact, and durable jobs remain visible in operations.
5. The existing single-replica scheduling constraint remains. Waitlist/daily notification jobs do not all have transactional outbox guarantees. Multi-replica deployment requires additional work.
6. This was not an independent penetration test, production load test or full cross-browser/screen-reader study. CMS page rendering is not proof of every operational action; the table lists the mutations actually exercised. Hardcoded page layouts and some marketing copy still require code changes rather than CMS editing.
7. The refreshed production dependency audit still reports three high entries in the Prisma tooling → `@prisma/config` → `deepmerge-ts` chain, and no critical entries. No forced downgrade was applied.
8. Earlier business-review requirements remain: photography rights, real testimonials, legal approval and vehicle-capacity promises need owner verification.

## Reproduce

```sh
npm test
npm run test:integration
npm run build
npm run typecheck
node scripts/audit-cms.mjs
# With the local production preview on port 3101:
AUDIT_BASE_URL=http://localhost:3101 node scripts/audit-browser.mjs
AUDIT_BASE_URL=http://localhost:3101 node scripts/audit-http.mjs
node scripts/audit-window.mjs
```

CMS/browser scripts use Playwright installed externally at `AUDIT_TOOLS` (default `/tmp/kiwi-audit-tools`) and installed Chrome. The CMS runner starts and stops its own production server on port 3102. Integration migrations must be applied before running it. Never point mutation tests at the operational database.
