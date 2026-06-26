import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/content";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default async function TermsPage() {
  const site = await getSiteSettings();
  const updated = "27 June 2026";

  return (
    <article className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-brand-900">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-foreground/50">Last updated: {updated}</p>

      <div className="mt-8 space-y-8 text-foreground/80 leading-relaxed">
        <section>
          <p>
            By booking a tour with {site.name} you agree to the following terms and conditions. Please read them
            carefully before completing your purchase.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">1. Bookings and payment</h2>
          <ul className="mt-3 list-disc pl-6 space-y-2 text-sm">
            <li>All bookings are subject to availability and are only confirmed once payment has been received in full.</li>
            <li>Prices are in New Zealand Dollars (NZD) and include GST where applicable.</li>
            <li>Payment is processed securely by Stripe. {site.name} does not store your card details.</li>
            <li>
              A seat reservation hold is created for a limited time (typically 10 minutes) when you begin checkout.
              If payment is not completed before the hold expires, your seats are released.
            </li>
            <li>
              On receipt of payment you will receive a booking confirmation email. Please retain this as proof of booking.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">2. Cancellation and refund policy</h2>
          <p className="mt-3">The following cancellation policy applies to all bookings:</p>
          <div className="mt-4 overflow-hidden rounded-xl border border-brand-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-100 bg-brand-50">
                  <th className="px-4 py-3 text-left font-semibold text-brand-900">Notice given</th>
                  <th className="px-4 py-3 text-left font-semibold text-brand-900">Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                <tr>
                  <td className="px-4 py-3">More than 72 hours before departure</td>
                  <td className="px-4 py-3 font-medium text-teal-700">Full refund</td>
                </tr>
                <tr className="bg-brand-50/40">
                  <td className="px-4 py-3">24–72 hours before departure</td>
                  <td className="px-4 py-3 font-medium text-amber-700">50% refund</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Less than 24 hours before departure</td>
                  <td className="px-4 py-3 font-medium text-red-700">No refund</td>
                </tr>
                <tr className="bg-brand-50/40">
                  <td className="px-4 py-3">No-show on the day</td>
                  <td className="px-4 py-3 font-medium text-red-700">No refund</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm">
            To cancel or modify a booking, please contact us at{" "}
            <a href={`mailto:${site.email}`} className="text-brand-600 underline">{site.email}</a>
            {site.phone && (
              <> or <a href={site.phoneHref || `tel:${site.phone}`} className="text-brand-600 underline">{site.phone}</a></>
            )}
            . The cancellation time is based on when we receive your request, not when it is sent.
          </p>
          <p className="mt-3 text-sm">
            Refunds are processed to your original payment method and typically appear within 5–10 business days,
            depending on your bank or card issuer.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">3. Operator cancellation</h2>
          <p className="mt-3">
            {site.name} reserves the right to cancel or modify a tour due to unsafe weather conditions, insufficient
            passenger numbers, mechanical issues, or other circumstances beyond our control.
          </p>
          <p className="mt-3">
            In the event of operator cancellation, you will be offered:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
            <li>A full refund to your original payment method, or</li>
            <li>A rebooking on an alternative date at no extra charge</li>
          </ul>
          <p className="mt-3 text-sm">
            {site.name} is not liable for any consequential costs such as accommodation, flights, or other travel
            arrangements affected by a tour cancellation.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">4. Promo codes and discounts</h2>
          <ul className="mt-3 list-disc pl-6 space-y-1 text-sm">
            <li>Promo codes are subject to their stated terms, expiry dates, and usage limits.</li>
            <li>Only one promo code may be applied per booking.</li>
            <li>Codes cannot be applied retrospectively after payment is complete.</li>
            <li>{site.name} reserves the right to withdraw or modify promo codes at any time.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">5. Guest responsibilities</h2>
          <ul className="mt-3 list-disc pl-6 space-y-2 text-sm">
            <li>
              Guests must arrive at the designated meeting point by the stated departure time. We cannot delay departures
              for late arrivals and no refund is given for missed tours.
            </li>
            <li>
              Guests are responsible for their own travel insurance, including cover for cancellation, medical emergencies,
              and personal belongings. We strongly recommend purchasing travel insurance.
            </li>
            <li>
              Guests must follow all safety instructions given by guides and partner operators. {site.name} reserves the
              right to refuse participation to any guest who poses a safety risk to themselves or others.
            </li>
            <li>
              Some tours involve physical activity. Guests with health concerns should consult a doctor before booking and
              inform us of any conditions that may affect their participation.
            </li>
            <li>
              Guests are responsible for any damage caused to vehicles, equipment, or property through negligence or
              misconduct.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">6. Limitation of liability</h2>
          <p className="mt-3">
            To the maximum extent permitted by law, {site.name}&apos;s liability for any claim arising from a booking is
            limited to the total amount paid for that booking. We are not liable for indirect, consequential, or special
            losses or damages.
          </p>
          <p className="mt-3">
            Nothing in these terms limits your rights under the Consumer Guarantees Act 1993 or the Fair Trading Act 1986
            (New Zealand).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">7. Privacy</h2>
          <p className="mt-3">
            Your personal information is handled in accordance with our{" "}
            <a href="/privacy-policy" className="text-brand-600 underline">Privacy Policy</a> and the New Zealand Privacy
            Act 2020.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">8. Governing law</h2>
          <p className="mt-3">
            These terms are governed by the laws of New Zealand. Any disputes will be subject to the exclusive jurisdiction
            of the courts of New Zealand.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">9. Changes to these terms</h2>
          <p className="mt-3">
            We may update these terms from time to time. The &ldquo;last updated&rdquo; date at the top of this page
            shows when they were last revised. Bookings made before any revision are governed by the terms in effect at
            the time of booking.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">10. Contact</h2>
          <p className="mt-3">
            Questions about these terms? Contact us at{" "}
            <a href={`mailto:${site.email}`} className="text-brand-600 underline">{site.email}</a>
            {site.phone && (
              <> or <a href={site.phoneHref || `tel:${site.phone}`} className="text-brand-600 underline">{site.phone}</a></>
            )}
            .
          </p>
        </section>
      </div>
    </article>
  );
}
