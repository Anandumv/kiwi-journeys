# Homepage art direction — 23 September 2026

## Reference review

- [Travel Next Level](https://travelnextlvl.de/en): directly inspected in the browser. Tall condensed typography, open landscape, a central doorway motif, and small supporting navigation. [Awwwards’ own SOTD announcement](https://www.linkedin.com/posts/awwwards_sotd-magazine-3d-activity-7278334261173121024-uwo3) confirms its recognition. The user explicitly selected this as the primary reference. Adopt spatial composition and typographic restraint; do not reuse their doorway assets, copy, or affiliate widgets.
- [Trawelt](https://www.trawelt.com/): directly inspected. A travel/hospitality consultancy, not a tour operator. Ticket-shaped modules, strong lime/black contrast and directional identity. Useful evidence that a consistent motif matters more than a collection of decorative cards. Its palette and moving carousel were not copied.
- [Banff & Lake Louise Tourism](https://www.banfflakelouise.com/): directly inspected as a practical tourism comparison. Place-specific hero links, photography credits, trip planning and duration details. Used for information hierarchy; no award claim is needed for this comparison.

## Implemented

The homepage opens with a spacious South Island landscape and Barlow Condensed headline. The existing video remains deferred until scrolling and disabled with reduced motion. Content is visible without JavaScript.

A large CMS tour photograph sits beside a compact index of other featured tours with real durations, destinations and prices. Active destinations form a separate directory. Private tours, cancellation terms, contact, guest reviews and the working newsletter signup remain accessible. No reference-site media was copied and no proof or testimonials were invented.

The existing logo, site navigation and booking flow remain in place. This pass changes homepage art direction; it does not claim the rest of the site now matches the reference or that the site is award-worthy.

## Verification

Production Webpack build and 52 unit tests passed. Desktop and phone screenshots were reviewed. The scripted browser audit checks 21 flows/layouts, including 11 public pages with axe. Its first run caught a low-contrast cruise-page sentence, changed from foreground/60 to foreground/75. Final rerun: 21/21 checks passed, including zero axe findings on the 11 tested public pages. Typecheck passed. Results are in outputs/audit/2026-09-23/browser-editorial.log.

The earlier Lighthouse scores describe the earlier design, not this revision. No new Lighthouse score is claimed here. No deployment or external payment/email delivery test was performed.

## Postcard concept

The user authorized choosing and building the strongest alternative to the reference doorway. Chosen: a printed South Island landscape expanding into an immersive view. Unlike the proposed coastal-road reveal, this can use the existing assets without implying a continuous filmed road sequence we do not possess. The frame straightens and recedes on native scroll; a dark scrim increases with expansion to protect white text contrast. Reduced motion keeps the static framed composition and requests no video. Desktop and phone expansion checks passed; screenshots are `postcard-expanded-390.png` and `postcard-expanded-1440.png`. The general browser suite passed 21/21 and unit tests 52/52 before the final scrim adjustment.

## Superseding direction: carriage window

The user subsequently chose the carriage-window scene. The hero now has an upright metallic surround, a faint CSS glass reflection and a smaller adjacent title. The window expands into the landscape on native scroll, with its rim, radius and reflection receding together. The static image and actual day-tour wording remain; no rail product or new footage is claimed. Motion verification is now `scripts/audit-window.mjs`.

Carriage-window validation: production build and 52 unit tests passed; 21/21 browser checks passed. Dedicated expansion/reduced-motion checks passed at 390px and 1440px. Both initial viewport screenshots were visually inspected. Local preview only.

## Interactive window refinement

Added published-tour scene choices (coast, high country, harbour), each with its own trip link. Added subtle scenery scaling, carriage sill depth and a scroll cue, with reduced-motion fallbacks. The headline is now “Take the window seat.” The scene controls are native buttons with aria-pressed; no autoplay or external requests beyond existing imagery/video were added.

## Carriage interior correction — 24 September

Replaced the dark radial backdrop with warm wall panels, recessed pale trim, a projecting sill and a cropped upholstered seat edge. The navigation is solid for consistent contrast. Text and the landscape scrim change with expansion. Initial desktop/phone screenshots reviewed; build, typecheck, 52 unit tests, 21 browser checks, and scene-selection/expansion/reduced-motion checks passed. No deployment.

## Window interaction polish — 24 September

Moved the scenery controls onto the wall below the glass, with larger touch targets. Selecting a scene now prevents the intro video from replacing it. Expansion uses measured sticky-frame height to handle short phones. Verified 375×667, 390×900 and 1440×900 for scene changes, expansion and reduced motion, plus explicit mobile overlap assertions. Production build, 52 unit tests and 21 general browser checks passed. Initial desktop/mobile screenshots reviewed.


## Carriage material refinement — 2026-09-25

User chose a realistic, cinematic interior. Replaced the synthetic wall/seat gradients with an original generated interior material study, compressed to a 98 KB WebP. This is a conceptual backdrop, not a photograph of an operator vehicle. Published landscape imagery and tour links remain independent. Raised desktop copy above the upholstered seat and timber; mobile has a light lower fade for readable copy. Reviewed screenshots at 390 and 1440 pixels. Window selection, expansion, reduced motion and mobile overlap checks passed at 375, 390 and 1440 pixels; the broader 21-check browser audit also passed. Production Webpack build passed. Local preview only.
