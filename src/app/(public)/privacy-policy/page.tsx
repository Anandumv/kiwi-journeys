import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/content";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const site = await getSiteSettings();
  return (
    <article className="mx-auto max-w-3xl px-4 py-20 sm:px-6 space-y-4 text-foreground/80 leading-relaxed">
      <h1 className="font-serif text-4xl font-semibold text-brand-900">Privacy Policy</h1>
      <p className="text-sm text-foreground/50">Placeholder policy — replace with your reviewed legal text before launch.</p>
      <p>{site.name} respects your privacy. We collect only the information needed to process your booking and provide our services — your name, contact details, and booking preferences.</p>
      <h2 className="text-xl font-semibold text-brand-900 pt-4">How we use your information</h2>
      <p>We use your details to confirm and deliver your tour, communicate with you, and meet legal obligations. Payment is processed securely by our payment provider (Stripe); we do not store your card details.</p>
      <h2 className="text-xl font-semibold text-brand-900 pt-4">Your rights</h2>
      <p>You may request access to, correction of, or deletion of your personal information at any time by contacting us at {site.email}.</p>
    </article>
  );
}
