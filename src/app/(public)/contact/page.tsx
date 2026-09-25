import { serializeJsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/ContactForm";
import { getSiteSettings } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";
export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Kiwi Globe Tours. Ask about our South Island day tours, private bookings, or group enquiries. We respond within one business day.",
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: { title: "Contact Kiwi Globe Tours", description: "Enquire about South Island day tours, private tours, or group bookings.", url: `${SITE_URL}/contact` },
};

export default async function ContactPage() {
  const site = await getSiteSettings();
  const contactLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${SITE_URL}/contact`,
    url: `${SITE_URL}/contact`,
    name: "Contact Kiwi Globe Tours",
    description: "Get in touch with Kiwi Globe Tours about South Island day tours, private bookings, or group enquiries.",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Contact", item: `${SITE_URL}/contact` },
      ],
    },
    mainEntity: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: site.phone,
        email: site.email,
        contactType: "customer service",
        areaServed: "NZ",
        availableLanguage: "English",
      },
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(contactLd) }} />
      <PageHero eyebrow="Get in touch" title="Get in touch" subtitle="Ask about a day trip, a departure, or planning a day just for your group." image="/images/tours/christchurch-city-sightseeing/7395a4_0f0c66ba88ab4145877047056c87fbea-mv2_1.jpg"
        caption="Tram line, central Christchurch"
      />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-foreground">Send us a message</h2>
          <p className="mt-2 text-sm text-foreground/75">We typically respond within one business day.</p>
          <div className="mt-6"><ContactForm /></div>
        </div>
        <div className="space-y-6">
          <div className="border-t border-[#202b2626] py-6">
            <h3 className="font-semibold text-foreground">Contact details</h3>
            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
              <li>Phone: <a href={site.phoneHref} className="text-brand-600 hover:underline">{site.phone}</a></li>
              <li>Email: <a href={`mailto:${site.email}`} className="text-brand-600 hover:underline">{site.email}</a></li>
              <li>{site.address}</li>
            </ul>
          </div>
          <div className="border-t border-[#202b2626] py-6">
            <h3 className="font-semibold text-foreground">Bespoke private tours</h3>
            <p className="mt-2 text-sm text-foreground/75">
              Tell us where you would like to go, your date and group size. We can suggest a private day trip.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
