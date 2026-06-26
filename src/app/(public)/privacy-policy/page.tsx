import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/content";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const site = await getSiteSettings();
  const updated = "27 June 2026";

  return (
    <article className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-brand-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-foreground/50">Last updated: {updated}</p>

      <div className="mt-8 space-y-8 text-foreground/80 leading-relaxed">
        <section>
          <p>
            {site.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your privacy in
            accordance with the New Zealand Privacy Act 2020. This policy explains what personal information we collect,
            why we collect it, how we use it, and your rights under New Zealand law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">1. What information we collect</h2>
          <p className="mt-3">We collect personal information that you provide when:</p>
          <ul className="mt-3 list-disc pl-6 space-y-1 text-sm">
            <li>Making a tour booking — name, email address, phone number, pickup location, and special requests</li>
            <li>Joining our waitlist — name, email address, and phone number</li>
            <li>Subscribing to our newsletter — email address</li>
            <li>Submitting a contact or enquiry form — name, email, and the content of your message</li>
            <li>Completing a post-tour survey — your feedback and ratings</li>
          </ul>
          <p className="mt-3">
            We may also collect information about how you use our website (pages visited, device type, browser) through
            analytics tools, in aggregated and anonymised form.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">2. Why we collect it</h2>
          <p className="mt-3">We use your personal information to:</p>
          <ul className="mt-3 list-disc pl-6 space-y-1 text-sm">
            <li>Process and confirm your booking and communicate about it</li>
            <li>Send pre-tour preparation information and reminders</li>
            <li>Process payments securely through our payment provider (Stripe)</li>
            <li>Respond to your enquiries and provide customer support</li>
            <li>Send marketing communications if you have given your consent</li>
            <li>Improve our tours and website based on feedback</li>
            <li>Meet legal and tax obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">3. Marketing communications</h2>
          <p className="mt-3">
            We will only send you marketing emails (tour news, offers, travel inspiration) if you have explicitly opted in
            at the time of booking or newsletter signup. Each marketing email includes an unsubscribe link. You can also
            withdraw consent at any time by emailing us at{" "}
            <a href={`mailto:${site.email}`} className="text-brand-600 underline">{site.email}</a>.
          </p>
          <p className="mt-3">
            We comply with the New Zealand Unsolicited Electronic Messages Act 2007. We will never send commercial
            electronic messages without your consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">4. Who we share your information with</h2>
          <p className="mt-3">We share your information only where necessary:</p>
          <ul className="mt-3 list-disc pl-6 space-y-1 text-sm">
            <li>
              <strong>Stripe</strong> — processes your payment. We do not store your card details. Stripe&apos;s privacy
              policy applies to payment data.
            </li>
            <li>
              <strong>Resend</strong> — delivers transactional and marketing emails on our behalf.
            </li>
            <li>
              <strong>Tour guides and partner operators</strong> — receive your name and booking details to deliver your
              tour safely.
            </li>
          </ul>
          <p className="mt-3">
            We do not sell or rent your personal information to third parties for their own marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">5. How long we keep your information</h2>
          <p className="mt-3">
            We retain booking records for seven years to meet our tax and legal obligations under New Zealand law.
            Newsletter subscribers are retained until they unsubscribe. Contact form enquiries are retained for two years.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">6. Your rights under the Privacy Act 2020</h2>
          <p className="mt-3">Under the New Zealand Privacy Act 2020 you have the right to:</p>
          <ul className="mt-3 list-disc pl-6 space-y-1 text-sm">
            <li>Ask whether we hold personal information about you</li>
            <li>Request access to that information</li>
            <li>Request correction of any information that is inaccurate or out of date</li>
            <li>Ask us to delete your information (subject to legal retention requirements)</li>
            <li>Complain to the Office of the Privacy Commissioner if you believe your privacy rights have been breached</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, email us at{" "}
            <a href={`mailto:${site.email}`} className="text-brand-600 underline">{site.email}</a>. We will respond
            within 20 working days as required by the Act.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">7. Cookies and analytics</h2>
          <p className="mt-3">
            Our website may use cookies and similar technologies to improve your browsing experience and to understand
            how visitors use our site. Analytics data is aggregated and does not identify you personally. You can disable
            cookies in your browser settings, although this may affect some site functionality.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">8. Security</h2>
          <p className="mt-3">
            We take reasonable steps to protect your personal information from unauthorised access, loss, or misuse.
            Payment transactions are encrypted via TLS and handled by Stripe, which is PCI DSS compliant.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">9. Changes to this policy</h2>
          <p className="mt-3">
            We may update this Privacy Policy from time to time. The &ldquo;last updated&rdquo; date at the top of this
            page shows when it was last revised. Continued use of our website after changes are posted constitutes your
            acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-900">10. Contact us</h2>
          <p className="mt-3">
            For any privacy enquiries, please contact us at{" "}
            <a href={`mailto:${site.email}`} className="text-brand-600 underline">{site.email}</a>
            {site.phone && (
              <> or by phone at <a href={site.phoneHref || `tel:${site.phone}`} className="text-brand-600 underline">{site.phone}</a></>
            )}.
          </p>
          <p className="mt-3">
            If you are not satisfied with our response, you may contact the Office of the Privacy Commissioner at{" "}
            <a href="https://www.privacy.org.nz" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
              www.privacy.org.nz
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
