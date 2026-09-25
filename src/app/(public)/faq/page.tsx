import { serializeJsonLd } from "@/lib/json-ld";
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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqLd) }}
      />
      <PageHero
        eyebrow="Help & information"
        title="Frequently Asked Questions"
        subtitle="Practical answers on booking, departures and changes."
        image="/images/tours/christchurch-city-sightseeing/7395a4_d9ebe4a801d948a1bbfab7a3f6609555-mv2_4.jpg"
        caption="Port Hills, Christchurch"
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20">
        <nav aria-label="FAQ topics" className="lg:sticky lg:top-28 lg:h-fit">
          <p className="text-[11px] font-semibold uppercase tracking-[.13em] text-foreground/75">Topics</p>
          <ol className="mt-3 border-t border-[#202b2626]">
            {faqCategories.map((cat, i) => (
              <li key={cat.title}>
                <a href={`#faq-${i + 1}`} className="flex gap-3 border-b border-[#202b2626] py-3 text-sm font-medium text-foreground/80 hover:text-foreground">
                  <span className="tabular-nums text-foreground/75">{String(i + 1).padStart(2, "0")}</span>{cat.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div>
        <div className="space-y-16">
          {faqCategories.map((cat, i) => (
            <section key={cat.title} id={`faq-${i + 1}`} className="scroll-mt-28">
              <h2 className="border-b-2 border-foreground pb-3 font-[family-name:var(--font-display)] text-[clamp(38px,4vw,56px)] font-medium leading-none tracking-[-.02em] text-foreground">
                {cat.title}
              </h2>
              <div>
                {cat.items.map((item) => (
                  <details
                    key={item.q}
                    className="group border-b border-[#202b2626] py-5"
                  >
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium tracking-[-.01em] text-foreground marker:hidden [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <span className="shrink-0 text-foreground/75 transition-transform duration-300 group-open:rotate-180">
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
                    <p className="mt-3 max-w-2xl leading-relaxed text-foreground/75">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 border-t border-[#202b2626] pt-8">
          <h2 className="text-2xl font-medium tracking-[-.02em] text-foreground">Still have questions?</h2>
          <p className="mt-2 text-sm text-foreground/75">
            Our team typically responds within one business day.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="bg-[#203c33] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#315445]"
            >
              Contact us
            </Link>
            <Link
              href="/private-tours"
              className="border border-foreground px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-foreground hover:text-[#f8f8f3]"
            >
              Enquire about a private tour
            </Link>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
