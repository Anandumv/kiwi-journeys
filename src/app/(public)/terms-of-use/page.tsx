import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/content";

export const metadata: Metadata = { title: "Terms of Use" };

export default async function TermsPage() {
  const site = await getSiteSettings();
  return (
    <article className="mx-auto max-w-3xl px-4 py-20 sm:px-6 space-y-4 text-foreground/80 leading-relaxed">
      <h1 className="font-serif text-4xl font-semibold text-brand-900">Terms of Use</h1>
      <p className="text-sm text-foreground/50">Placeholder terms — replace with your reviewed legal text before launch.</p>
      <h2 className="text-xl font-semibold text-brand-900 pt-2">Bookings &amp; payment</h2>
      <p>All bookings are subject to availability and confirmed only once payment is received. Prices are in New Zealand Dollars (NZD) and include GST where applicable.</p>
      <h2 className="text-xl font-semibold text-brand-900 pt-2">Cancellations</h2>
      <p>Cancellation terms vary by tour. Please contact us at {site.email} regarding changes or cancellations. Tours may be cancelled due to weather or safety; in such cases a full refund or reschedule is offered.</p>
      <h2 className="text-xl font-semibold text-brand-900 pt-2">Liability</h2>
      <p>Guests participate in activities at their own risk and must follow all safety instructions provided by guides and partner operators.</p>
    </article>
  );
}
