import type { Metadata } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/lib/content";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${s.name} — ${s.tagline}`, template: `%s | ${s.name}` },
    description: s.description,
    alternates: { canonical: "/" },
    openGraph: {
      title: s.name,
      description: s.description,
      type: "website",
      siteName: s.name,
      images: [{ url: s.heroImage || "/images/brand/Hero-Ocean-Alps.jpg" }],
    },
    twitter: { card: "summary_large_image", title: s.name, description: s.description },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const s = await getSiteSettings();
  const abs = (p?: string | null) => (p ? (p.startsWith("http") ? p : `${SITE_URL}${p}`) : undefined);

  // Site-wide structured data — TravelAgency (brand/knowledge-panel) + WebSite.
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${SITE_URL}/#organization`,
    name: s.name,
    url: SITE_URL,
    description: s.description,
    image: abs(s.heroImage),
    logo: abs(s.logoImage),
    telephone: s.phone,
    email: s.email,
    areaServed: { "@type": "Country", name: "New Zealand" },
    address: { "@type": "PostalAddress", addressCountry: "NZ" },
    sameAs: Object.values(s.social ?? {}).filter(Boolean),
  };
  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: s.name,
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
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
