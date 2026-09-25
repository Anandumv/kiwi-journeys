import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { GiftVoucherForm } from "@/components/GiftVoucherForm";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export const metadata: Metadata = {
  title: "Gift Vouchers",
  description:
    "Give the gift of a New Zealand South Island adventure. Kiwi Globe Tours gift vouchers are valid for one year and redeemable on any tour.",
  alternates: { canonical: `${SITE_URL}/gift-vouchers` },
  openGraph: {
    title: "Gift Vouchers — Kiwi Globe Tours",
    description: "Give the gift of a New Zealand adventure.",
    url: `${SITE_URL}/gift-vouchers`,
  },
};

const HOW_IT_WORKS = [
  { title: "Valid for 1 year", body: "The recipient has a year to choose a date." },
  { title: "Redeemable on any tour", body: "Apply on any Kiwi Globe Tours day tour — full or partial balance." },
  { title: "Delivery by email", body: "The code is sent by email after payment is confirmed." },
  { title: "Any amount from $50", body: "Choose a preset value or enter your own custom amount." },
];

export default function GiftVouchersPage() {
  return (
    <>
      <PageHero
        eyebrow="For someone going places"
        title="Gift Vouchers"
        subtitle="A day out they can choose for themselves."
        image="/images/tours/hanmer-springs-day-tour/7395a4_529cbc3a6ae14c5997e962e0245b3268-mv2_4.jpg"
        caption="Hanmer Springs thermal pools"
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-foreground">
              Purchase a voucher
            </h2>
            <p className="mt-2 text-sm text-foreground/75">
              The voucher code is sent by email after payment is confirmed.
            </p>
            <div className="mt-8">
              <GiftVoucherForm />
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-foreground">How it works</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {HOW_IT_WORKS.map((f) => (
                  <div key={f.title} className="border-t border-[#202b2626] py-4">
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-1 text-sm text-foreground/75">{f.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#202b2626] pt-6">
              <h3 className="font-semibold text-foreground">How to redeem</h3>
              <ol className="mt-3 space-y-2 text-sm text-foreground/75 list-decimal list-inside">
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
