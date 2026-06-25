import type { Metadata } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";
import { getSiteSettings, getTestimonials } from "@/lib/content";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const ogImage = s.heroImage || "/images/brand/Hero-Ocean-Alps.jpg";
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${s.name} — ${s.tagline}`, template: `%s | ${s.name}` },
    description: s.description,
    keywords: ["New Zealand day tours", "South Island tours", "Christchurch day trips", "NZ tour operator", "small group tours New Zealand"],
    authors: [{ name: s.name, url: SITE_URL }],
    creator: s.name,
    publisher: s.name,
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    alternates: { canonical: SITE_URL },
    openGraph: {
      title: `${s.name} — ${s.tagline}`,
      description: s.description,
      type: "website",
      siteName: s.name,
      url: SITE_URL,
      locale: "en_NZ",
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${s.name} — New Zealand Day Tours` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${s.name} — ${s.tagline}`,
      description: s.description,
      images: [ogImage],
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [s, testimonials] = await Promise.all([getSiteSettings(), getTestimonials()]);
  const abs = (p?: string | null) => (p ? (p.startsWith("http") ? p : `${SITE_URL}${p}`) : undefined);
  const avgRating = testimonials.length
    ? +(testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : 5;

  // Site-wide structured data — TravelAgency + WebSite with sitelinks search box.
  const orgLd = {
    "@context": "https://schema.org",
    "@type": ["TravelAgency", "LocalBusiness"],
    "@id": `${SITE_URL}/#organization`,
    name: s.name,
    url: SITE_URL,
    description: s.description,
    image: abs(s.heroImage),
    logo: { "@type": "ImageObject", url: abs(s.logoImage) ?? `${SITE_URL}/icon.png` },
    telephone: s.phone,
    email: s.email,
    priceRange: "NZD $$",
    currenciesAccepted: "NZD",
    paymentAccepted: "Credit Card",
    areaServed: [
      { "@type": "State", name: "Canterbury", addressCountry: "NZ" },
      { "@type": "Country", name: "New Zealand" },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: s.address || "",
      addressLocality: "Christchurch",
      addressRegion: "Canterbury",
      addressCountry: "NZ",
    },
    geo: { "@type": "GeoCoordinates", latitude: -43.5321, longitude: 172.6362 },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "08:00",
      closes: "18:00",
    },
    knowsAbout: [
      "New Zealand Day Tours",
      "South Island Tourism",
      "Christchurch Tours",
      "Akaroa Tours",
      "Kaikōura Wildlife Tours",
      "Hanmer Springs Tours",
      "Small Group Tours New Zealand",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      bestRating: 5,
      worstRating: 1,
      reviewCount: testimonials.length || 1,
    },
    sameAs: Object.values(s.social ?? {}).filter(Boolean),
  };
  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: s.name,
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/tours?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-screen bg-ivory text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }} />
        {children}
      </body>
    </html>
  );
}
