import Link from "next/link";

const details = [
  { title: "Book directly", body: "Choose your tour, check departure dates, and book with the team running your trip.", href: "/tours", link: "See tours" },
  { title: "Ask us first", body: "Need help with pickup, dates, or travelling with a group? Talk to our team before you book.", href: "/contact", link: "Contact the team" },
  { title: "Know your options", body: "Cancel more than 72 hours before departure for a full refund. Check the terms for shorter-notice cancellations.", href: "/terms-of-use", link: "Read the terms" },
];

export function WhyBookDirect() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <h2 className="text-2xl font-semibold tracking-tight text-brand-900">Good to know before you go.</h2>
      <div className="mt-8 grid gap-8 md:grid-cols-3 md:gap-12">
        {details.map((detail) => (
          <div key={detail.title} className="border-t border-brand-900/20 pt-5">
            <h3 className="text-base font-semibold text-brand-900">{detail.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">{detail.body}</p>
            <Link href={detail.href} className="mt-5 inline-block text-sm font-semibold text-brand-800 underline underline-offset-4">{detail.link} →</Link>
          </div>
        ))}
      </div>
    </section>
  );
}
