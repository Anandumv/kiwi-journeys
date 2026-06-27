import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { GiftVoucherForm } from "@/components/GiftVoucherForm";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export const metadata: Metadata = {
  title: "Gift Vouchers",
  description:
    "Give the gift of a New Zealand South Island adventure. Kiwi Journeys gift vouchers are valid for one year and redeemable on any tour.",
  alternates: { canonical: `${SITE_URL}/gift-vouchers` },
  openGraph: {
    title: "Gift Vouchers — Kiwi Journeys",
    description: "Give the gift of a New Zealand adventure.",
    url: `${SITE_URL}/gift-vouchers`,
  },
};

const HOW_IT_WORKS = [
  { title: "Valid for 1 year", body: "Recipients have a full year to choose their perfect adventure." },
  { title: "Redeemable on any tour", body: "Apply on any Kiwi Journeys day tour — full or partial balance." },
  { title: "Instant digital delivery", body: "Voucher code emailed instantly after purchase. No waiting." },
  { title: "Any amount from $50", body: "Choose a preset value or enter your own custom amount." },
];

export default function GiftVouchersPage() {
  return (
    <>
      <PageHero
        eyebrow="Give the gift of adventure"
        title="Gift Vouchers"
        subtitle="The perfect present for anyone who loves to explore New Zealand."
        image="/images/general/tekapo-church-sunset.jpg"
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-brand-900">
              Purchase a voucher
            </h2>
            <p className="mt-2 text-sm text-foreground/70">
              The voucher code is emailed instantly after payment.
            </p>
            <div className="mt-8">
              <GiftVoucherForm />
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-brand-900">How it works</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {HOW_IT_WORKS.map((f) => (
                  <div key={f.title} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
                    <h3 className="font-semibold text-brand-800">{f.title}</h3>
                    <p className="mt-1 text-sm text-foreground/70">{f.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6">
              <h3 className="font-semibold text-brand-800">How to redeem</h3>
              <ol className="mt-3 space-y-2 text-sm text-foreground/70 list-decimal list-inside">
                <li>Browse and choose a tour at /tours</li>
                <li>Select your date and guests, proceed to checkout</li>
                <li>
                  Enter your code in the <strong>Gift voucher</strong> field at checkout
                </li>
                <li>The balance is deducted from your total automatically</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
