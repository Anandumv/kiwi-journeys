import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Gift Voucher purchased!" };

export default function GiftVoucherSuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <div className="text-5xl mb-4">🎁</div>
      <h1 className="font-serif text-3xl font-semibold text-brand-900">
        Your gift voucher is on its way!
      </h1>
      <p className="mt-4 text-foreground/70">
        The voucher code has been sent to your email. If you provided a recipient email, they'll
        receive the gift message too.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/tours"
          className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Browse tours
        </Link>
        <Link
          href="/"
          className="rounded-full border border-brand-200 px-6 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
