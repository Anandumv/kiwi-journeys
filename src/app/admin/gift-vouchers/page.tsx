import { prisma } from "@/lib/db";
import { formatNZD } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gift Vouchers — Admin" };

export default async function AdminGiftVouchersPage() {
  const vouchers = await prisma.giftVoucher.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const totalActive = vouchers.filter((v) => v.isActive && v.balanceCents > 0).length;
  const totalOutstandingCents = vouchers
    .filter((v) => v.isActive)
    .reduce((sum, v) => sum + v.balanceCents, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-900">Gift Vouchers</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40">Total issued</p>
          <p className="mt-1 text-3xl font-bold text-brand-900">{vouchers.length}</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40">Active with balance</p>
          <p className="mt-1 text-3xl font-bold text-brand-900">{totalActive}</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40">Outstanding balance</p>
          <p className="mt-1 text-3xl font-bold text-brand-900">{formatNZD(totalOutstandingCents)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-brand-100 bg-brand-50 text-left text-xs font-semibold uppercase tracking-wider text-foreground/50">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Purchaser</th>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Purchased</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {vouchers.map((v) => {
              const statusLabel = !v.isActive ? "Pending" : v.balanceCents <= 0 ? "Used" : "Active";
              const statusClass = !v.isActive
                ? "bg-amber-100 text-amber-800"
                : v.balanceCents <= 0
                ? "bg-ivory text-foreground/50"
                : "bg-teal-100 text-teal-800";
              return (
                <tr key={v.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3 font-mono font-semibold text-brand-700">{v.code}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatNZD(v.amountCents)}</td>
                  <td className="px-4 py-3 font-medium">{formatNZD(v.balanceCents)}</td>
                  <td className="px-4 py-3">
                    <div>{v.purchaserName}</div>
                    <div className="text-xs text-foreground/50">{v.purchaserEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    {v.recipientName ? (
                      <>
                        <div>{v.recipientName}</div>
                        <div className="text-xs text-foreground/50">{v.recipientEmail}</div>
                      </>
                    ) : (
                      <span className="text-foreground/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground/60">
                    {v.expiresAt ? v.expiresAt.toLocaleDateString("en-NZ") : "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground/60">
                    {v.createdAt.toLocaleDateString("en-NZ")}
                  </td>
                </tr>
              );
            })}
            {vouchers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-foreground/40">
                  No gift vouchers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
