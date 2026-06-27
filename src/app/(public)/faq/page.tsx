import type { Metadata } from "next";
import Link from "next/link";
import { faqCategories } from "@/data/faq";
import { PageHero } from "@/components/PageHero";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about booking Kiwi Journeys South Island day tours — cancellations, what to bring, group bookings, accessibility and more.",
  alternates: { canonical: `${SITE_URL}/faq` },
};

export default function FaqPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqCategories.flatMap((cat) =>
      cat.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      }))
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <PageHero
        eyebrow="Help & information"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know before you book."
        image="/images/general/tekapo-church-sunset.jpg"
      />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="space-y-12">
          {faqCategories.map((cat) => (
            <section key={cat.title}>
              <h2 className="font-serif text-2xl font-semibold text-brand-900 mb-6">
                {cat.title}
              </h2>
              <div className="space-y-4">
                {cat.items.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-2xl border border-brand-100 bg-white px-6 py-4 shadow-sm"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-brand-800 marker:hidden">
                      {item.q}
                      <span className="shrink-0 text-brand-400 transition-transform group-open:rotate-180">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M5 7.5L10 12.5L15 7.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/70">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center">
          <h3 className="font-serif text-xl font-semibold text-brand-900">Still have questions?</h3>
          <p className="mt-2 text-sm text-foreground/70">
            Our team typically responds within one business day.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Contact us
            </Link>
            <Link
              href="/private-tours"
              className="rounded-full border border-brand-200 px-6 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Enquire about a private tour
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
