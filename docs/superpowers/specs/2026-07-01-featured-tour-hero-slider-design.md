# Featured Tour Hero Slider Design

## Context

The current homepage uses a static full-bleed hero from `getSiteSettings().heroImage`, followed by trust signals, featured tour cards, destinations, experience categories, testimonials, booking-direct content, newsletter signup, and a final CTA.

The goal is to make the hero feel like a moving tour preview without turning the whole homepage into a slide deck. The homepage should remain searchable, scannable, and booking-oriented.

## Decision

Build a featured-tour hero slider at the top of the homepage.

The slider will use the existing featured tours returned by `getTours()`, filtered by `tour.featured`, with the current site settings hero as a fallback if there are no featured tours.

## User Experience

The hero will show one featured tour at a time:

- Full-bleed tour image as the hero background.
- Existing site tagline as the eyebrow.
- Tour title as the main headline.
- Tour destination, duration, and price-from metadata.
- Short tour summary.
- Primary CTA to the tour detail page: `/tours/${tour.slug}`.
- Secondary CTA to all tours.
- Desktop arrows and slide dots.
- Mobile swipe or drag support.
- Auto-advance every 6 seconds, paused after user interaction.

The existing trust strip remains directly below the hero so social proof stays visible early.

## Recommended Content Rules

Use 4-6 featured tours if available. If more than 6 tours are featured, use the first 6 in current sort order. If fewer than 2 tours are featured, render a static hero using the current site settings content rather than showing carousel controls for a single item.

The slide headline should be the tour title, not a generic marketing line. This makes each slide concrete and directly bookable.

## Architecture

Add a client component for the interactive hero at `src/components/FeaturedTourHero.tsx`.

Keep `src/app/(public)/page.tsx` as the server component that fetches content. It will pass `featured` tours and site settings into the client hero.

The client component owns only UI state:

- active slide index
- paused/interacted state
- previous/next navigation
- dot selection
- swipe or drag handling
- reduced-motion behavior

The component should not fetch data.

## Data Flow

`HomePage`:

1. Fetch tours, destinations, testimonials, and site settings.
2. Build `featured = tours.filter((t) => t.featured).slice(0, 6)`.
3. Render `FeaturedTourHero` with `featuredTours={featured}` and `settings={s}`.
4. Keep the rest of the homepage sections unchanged unless minor spacing adjustments are needed.

`FeaturedTourHero`:

1. If there are fewer than 2 featured tours, render a static hero equivalent to the current hero.
2. If there are 2 or more featured tours, render carousel slides.
3. Use `next/image` for slide images.
4. Use existing route patterns: `/tours/${tour.slug}` and `/tours`.

## Motion And Accessibility

The hero can feel cinematic, but motion must be controlled:

- Respect `prefers-reduced-motion` by disabling auto-advance and heavy image movement.
- Pause auto-advance after manual interaction.
- Keep controls keyboard-accessible.
- Add visible focus states.
- Use buttons for carousel controls.
- Avoid hiding meaningful text inside image-only UI.
- Maintain strong overlay contrast for text readability.

## Visual Direction

Keep the current premium travel feel:

- Full-bleed image background.
- Dark brand gradient overlay.
- Serif headline.
- Sand/gold primary CTA.
- Compact metadata pill row for destination, duration, and price.
- Dots and arrows should feel quiet and polished, not like a generic plugin carousel.

The carousel controls should not create layout shift between slides.

## Error Handling And Fallbacks

- If a tour lacks an image, use `settings.heroImage`.
- If no featured tours exist, keep the current static hero behavior.
- If price data is missing or invalid, omit the price metadata instead of rendering broken text.
- If JavaScript fails, the initial server-rendered slide should still show meaningful hero content and links.

## Testing

Manual verification:

- Desktop hero renders with multiple featured tours.
- Mobile layout keeps text and controls readable.
- Arrows, dots, and swipe/drag change slides.
- CTAs navigate to the expected pages.
- Single/no featured tour fallback renders without carousel controls.
- Reduced-motion preference disables auto-advance and heavy motion.

Automated checks:

- Run TypeScript/build verification.
- Add a focused component test only if the project already has a frontend test pattern available. Otherwise, keep verification to build and browser checks.

## Out Of Scope

- Full-page scroll snapping homepage.
- New CMS schema fields.
- New third-party carousel dependency.
- Rewriting the featured tours section.
- Changing tour sorting or admin featured-tour management.
