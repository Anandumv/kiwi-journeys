import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { TourCard } from "@/components/TourCard";
import { getDestinations, getTours } from "@/lib/content";

// Map a destination slug to the tours that visit it (loose match on destination text).
const regionMatch: Record<string, (dest: string) => boolean> = {
  christchurch: (d) => d.includes("Christchurch") || d === "Waimakariri",
  akaroa: (d) => d.includes("Akaroa"),
  kaikoura: (d) => d.includes("Kaik"),
  waipara: (d) => d.includes("Waipara"),
  "hanmer-springs": (d) => d.includes("Hanmer"),
  tekapo: (d) => d.includes("Tekapo"),
};

const regionFaqs: Record<string, { q: string; a: string }[]> = {
  christchurch: [
    { q: "What are the best day trips from Christchurch?", a: "The most popular day trips from Christchurch are Akaroa (scenic harbour village, 90 min drive), Kaikōura (whale watching and seals, 2 hrs north), and Hanmer Springs (alpine thermal pools, 1.5 hrs north). All can be done comfortably as a single day." },
    { q: "How long are day tours from Christchurch?", a: "Most Christchurch day tours run 5–8 hours. Full-day trips to Akaroa, Kaikōura, and Hanmer Springs run 8–10 hours. City-based tours like Christchurch City Discovery are typically 5–6 hours." },
    { q: "Do tours include hotel pickup from Christchurch?", a: "Yes — pickup is available from most central Christchurch hotels and accommodation. The exact pickup location is confirmed at booking." },
    { q: "What is the maximum group size on Christchurch day tours?", a: "All our tours are capped at 16 guests. We deliberately keep groups small so everyone gets a genuine experience, not a coach-tour experience." },
  ],
  akaroa: [
    { q: "How far is Akaroa from Christchurch?", a: "Akaroa is approximately 85km (53 miles) southeast of Christchurch — about a 1.5 hour scenic drive through the Banks Peninsula hills." },
    { q: "What is Akaroa known for?", a: "Akaroa is a charming French-colonial harbour village on Banks Peninsula. It's famous for Hector's dolphins (one of the world's rarest), French heritage architecture, local artisan food, and dramatic volcanic scenery." },
    { q: "Can you swim with dolphins in Akaroa?", a: "Yes — Akaroa is home to Hector's dolphins, the world's smallest dolphin species. Our Akaroa Swim with Dolphins tour runs October through April when the dolphins are most active in the harbour." },
    { q: "What else can you do on an Akaroa day tour?", a: "Beyond dolphins, an Akaroa day tour typically includes a harbour cruise, walking the historic main street, visiting local cafés and artisan producers, and enjoying panoramic views of Banks Peninsula." },
  ],
  kaikoura: [
    { q: "What wildlife can I see in Kaikōura?", a: "Kaikōura is one of New Zealand's premier wildlife destinations. You can see sperm whales year-round, dusky dolphins (often in pods of hundreds), New Zealand fur seals, and a wide variety of seabirds including albatross and petrels." },
    { q: "How far is Kaikōura from Christchurch?", a: "Kaikōura is approximately 180km north of Christchurch — about 2 hours by road along the spectacular Kaikōura coast highway, with mountain and ocean views the entire way." },
    { q: "Is the Kaikōura day tour suitable for children?", a: "Yes — the Kaikōura Wildlife Coast day tour is great for families. Children love the seal colony at Point Kean and the chance to see whales in the wild. Activity levels are gentle and suitable for all ages." },
    { q: "What is the best time of year to visit Kaikōura?", a: "Kaikōura is a year-round destination. Sperm whales are present throughout the year. Summer (December–February) offers the best weather, while winter visits are often quieter with equally good wildlife sightings." },
  ],
  "hanmer-springs": [
    { q: "How far is Hanmer Springs from Christchurch?", a: "Hanmer Springs is about 135km north of Christchurch — approximately 1.5 hours by road through the Lewis Pass foothills and the Waiau River valley." },
    { q: "What is Hanmer Springs known for?", a: "Hanmer Springs is New Zealand's premier alpine spa village, renowned for its natural thermal mineral pools, forest walks, mountain scenery, and adventure activities including bungy jumping, jet boating, and zip-lining." },
    { q: "Are the Hanmer Springs thermal pools included in the tour price?", a: "Thermal pool entry is an optional add-on to the Hanmer Springs day tour — not included in the base price, but easy to add at booking. The main Hanmer Springs Thermal Pools & Spa complex has pools ranging from cool to very hot." },
    { q: "Is Hanmer Springs suitable for families?", a: "Yes — Hanmer Springs is very family-friendly. The thermal complex has pools at different temperatures and a fun section for children. The forest walks are gentle and the village is relaxed and easy to explore." },
  ],
  waipara: [
    { q: "What wineries are in the Waipara Valley?", a: "The Waipara Valley is home to award-winning boutique wineries known for Pinot Noir, Riesling, and Pinot Gris. The warm, sheltered valley produces some of Canterbury's most distinctive wines. Our wine trail visits 2–3 cellar doors with tastings included." },
    { q: "How far is Waipara from Christchurch?", a: "Waipara Valley is about 50km north of Christchurch — less than an hour's drive. It makes an ideal half-day or leisurely full-day wine tour without a long journey." },
    { q: "Do I need to know about wine to enjoy the Waipara tour?", a: "Not at all. Our guides make the tasting experience accessible and enjoyable for everyone — whether you're a wine enthusiast or a complete beginner. The focus is on relaxed enjoyment and beautiful Canterbury scenery." },
    { q: "Is food included on the Waipara wine tour?", a: "Check your specific tour inclusions at booking. Many cellar doors offer platters and food pairing options on-site. We recommend eating before the tour as lunch is typically not included in the base price." },
  ],
  tekapo: [
    { q: "How far is Lake Tekapo from Christchurch?", a: "Lake Tekapo is about 230km southwest of Christchurch — roughly a 3 hour drive through Geraldine and the Mackenzie Country, done as a guided day trip with stops along the way." },
    { q: "What is Lake Tekapo known for?", a: "Lake Tekapo is famous for its strikingly turquoise, glacier-fed water, the lakefront Church of the Good Shepherd, and its International Dark Sky Reserve — one of the best stargazing locations in the world." },
    { q: "Can I do a Lake Tekapo day trip from Christchurch?", a: "Yes — our Lake Tekapo Alpine Adventure runs as a full-day guided trip, with time at the lakefront, the Church of the Good Shepherd, and the Mt John Lookout, returning to Christchurch the same evening." },
    { q: "Is the Lake Tekapo tour suitable for families?", a: "Yes — the pace is gentle and the main stops (lakefront walk, church, lookout) are easy for all ages. Optional add-ons like the Dark Sky Experience suit older children and adults best." },
  ],
};

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const { region } = await params;
  const destinations = await getDestinations();
  const dest = destinations.find((d) => d.slug === region);
  if (!dest) return { title: "Destination" };
  const url = `${SITE_URL}/destinations/${dest.slug}`;
  const description = dest.intro || dest.blurb || `Explore day tours in ${dest.name}, New Zealand.`;
  return {
    title: `${dest.name} Day Tours`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${dest.name} Day Tours | New Zealand`,
      description,
      url,
      images: dest.heroImage ? [{ url: dest.heroImage, width: 1200, height: 630, alt: dest.name }] : undefined,
    },
    twitter: { card: "summary_large_image", title: `${dest.name} Day Tours`, description },
  };
}

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  const [destinations, tours] = await Promise.all([getDestinations(), getTours()]);
  const dest = destinations.find((d) => d.slug === region && d.status === "active");
  if (!dest) notFound();

  const match = regionMatch[region] ?? (() => false);
  const regionTours = tours.filter((t) => match(t.destination));
  const pageUrl = `${SITE_URL}/destinations/${region}`;
  const faqs = regionFaqs[region] ?? [];

  const destinationLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "@id": pageUrl,
    name: dest.name,
    description: dest.intro || dest.blurb,
    url: pageUrl,
    image: dest.heroImage ?? undefined,
    touristType: { "@type": "Audience", audienceType: "Tourists" },
    includesAttraction: regionTours.map((t) => ({
      "@type": "TouristAttraction",
      name: t.title,
      url: `${SITE_URL}/tours/${t.slug}`,
    })),
    containedInPlace: { "@type": "Country", name: "New Zealand" },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Destinations", item: `${SITE_URL}/destinations` },
      { "@type": "ListItem", position: 3, name: dest.name, item: pageUrl },
    ],
  };

  const faqLd = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(destinationLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      <PageHero eyebrow="Destination" title={dest.name} subtitle={dest.intro ?? dest.blurb} image={dest.heroImage ?? undefined} />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="font-serif text-3xl font-semibold text-brand-900">Tours in {dest.name}</h2>
        {regionTours.length === 0 ? (
          <p className="mt-4 text-foreground/60">New tours for this destination are coming soon.</p>
        ) : (
          <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {regionTours.map((t) => <TourCard key={t.slug} tour={t} />)}
          </div>
        )}
      </section>
      {faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          <h2 className="font-serif text-2xl font-semibold text-brand-900">Frequently asked questions</h2>
          <dl className="mt-6 space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-xl border border-brand-100 bg-white p-5">
                <dt className="font-semibold text-brand-900">{f.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-foreground/70">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </>
  );
}
