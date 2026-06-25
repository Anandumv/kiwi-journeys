import type { Metadata } from "next";

export const metadata: Metadata = { title: "Visual Credit" };

export default function VisualCreditPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 space-y-4 text-foreground/80 leading-relaxed">
      <h1 className="text-3xl font-bold text-brand-900">Visual Credit</h1>
      <p>
        Photography on this site showcases the landscapes and experiences of New Zealand&apos;s South
        Island. Replace these placeholder images with your own licensed photography before launch and
        credit photographers/partners here as required.
      </p>
    </article>
  );
}
