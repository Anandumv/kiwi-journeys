import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/ContactForm";
import { getSiteSettings } from "@/lib/content";

export const metadata: Metadata = { title: "Contact", description: "Get in touch with us." };

export default async function ContactPage() {
  const site = await getSiteSettings();
  return (
    <>
      <PageHero eyebrow="Get in touch" title="Contact Us" subtitle="Have questions or want a bespoke private tour? We'd love to help." image="/images/general/tekapo-church-sunset.jpg" />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-brand-900">Send us a message</h2>
          <p className="mt-2 text-sm text-foreground/70">We typically respond within one business day.</p>
          <div className="mt-6"><ContactForm /></div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6">
            <h3 className="font-semibold text-brand-800">Contact details</h3>
            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
              <li>Phone: <a href={site.phoneHref} className="text-brand-600 hover:underline">{site.phone}</a></li>
              <li>Email: <a href={`mailto:${site.email}`} className="text-brand-600 hover:underline">{site.email}</a></li>
              <li>{site.address}</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-brand-100 p-6">
            <h3 className="font-semibold text-brand-800">Bespoke private tours</h3>
            <p className="mt-2 text-sm text-foreground/70">
              Let us craft a journey that&apos;s uniquely yours — complete flexibility, comfort and
              exclusivity, built around what matters most to you.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
