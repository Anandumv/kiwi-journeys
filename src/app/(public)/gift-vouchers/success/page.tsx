import type { Metadata } from "next";
import Link from "next/link";
import { TaskShell } from "@/components/TaskShell";

export const metadata: Metadata = { title: "Gift Voucher purchased!" };

export default function GiftVoucherSuccessPage() {
  return (
    <TaskShell
      eyebrow="Gift voucher"
      title="Your voucher is on its way"
      intro="Once payment is confirmed, the voucher code is emailed to you. If you added a recipient email, they receive the gift message too."
    >
      <p className="text-[11px] font-semibold uppercase tracking-[.13em] text-foreground/75">What next</p>
      <ul className="mt-3 border-t border-[#202b2626] text-foreground/85">
        <li className="border-b border-[#202b2626] py-3">The code works on any day tour, for a full or partial balance.</li>
        <li className="border-b border-[#202b2626] py-3">Enter it in the gift voucher field at checkout.</li>
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/tours" className="bg-[#203c33] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#315445]">Browse tours</Link>
        <Link href="/" className="border border-foreground px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-foreground hover:text-[#f8f8f3]">Back to home</Link>
      </div>
    </TaskShell>
  );
}
