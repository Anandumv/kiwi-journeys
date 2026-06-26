// Original NZ travel posts (the reference site used placeholder "Moliva" filler;
// these are real, swappable content for SEO/value).

export type Post = {
  slug: string;
  title: string;
  date: string; // ISO
  excerpt: string;
  body: string[];
};

export const posts: Post[] = [
  {
    slug: "best-time-to-visit-christchurch",
    title: "The Best Time to Visit Christchurch & Canterbury",
    date: "2026-02-10",
    excerpt: "From alpine summers to crisp golden autumns — when to plan your South Island day tours.",
    body: [
      "Christchurch is a year-round destination, but each season offers something different. Summer (December–February) brings long, warm days perfect for the Akaroa harbour cruise and Waimakariri jet boating.",
      "Autumn (March–May) paints the city's parks in gold and is ideal for the Waipara wine trail. Winter (June–August) is the time for Hanmer Springs' thermal pools and crisp alpine views on the TranzAlpine.",
      "Spring (September–November) sees gardens bloom across the Garden City — a wonderful time for the city sightseeing tour.",
    ],
  },
  {
    slug: "swimming-with-dolphins-in-new-zealand",
    title: "Swimming with Dolphins in New Zealand: What to Know",
    date: "2026-01-22",
    excerpt: "Kaikōura's dusky dolphins and Akaroa's rare Hector's dolphins — a guide to a once-in-a-lifetime encounter.",
    body: [
      "New Zealand offers two extraordinary dolphin swims from Christchurch. In Kaikōura, you'll join pods of playful dusky dolphins in the open ocean, while Akaroa is one of the only places on Earth to swim with the tiny, endangered Hector's dolphin.",
      "Both experiences are weather- and season-dependent — Akaroa swims pause from May to August — and require a basic level of swimming fitness. Wetsuits and snorkel gear are provided.",
      "Encounters are always conducted on the animals' terms, guided by experienced marine specialists who put the dolphins' wellbeing first.",
    ],
  },
  {
    slug: "a-day-in-akaroa",
    title: "A Perfect Day in Akaroa & Banks Peninsula",
    date: "2025-12-12",
    excerpt: "French heritage, volcanic harbours and artisan cheese — the highlights of a Banks Peninsula day trip.",
    body: [
      "Just over an hour from Christchurch, Akaroa sits within an ancient volcanic crater flooded by the sea. The historic French village charms with boutique shops, a scenic waterfront and whaling-era history.",
      "A harbour nature cruise is the centrepiece — searching for Hector's dolphins, Little Blue Penguins and seabirds — before a stop at Barry's Bay to sample locally crafted artisan cheeses on the way home.",
    ],
  },
];

export const postsBySlug = Object.fromEntries(posts.map((p) => [p.slug, p]));
