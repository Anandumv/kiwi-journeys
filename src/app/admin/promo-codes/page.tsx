import { prisma } from "@/lib/db";
import { formatNZD } from "@/lib/money";
import { createPromoCode, deletePromoCode, togglePromoCode, updatePromoCode } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promo Codes" };

const input = "w-full rounded-lg border border-ivory-200 px-3 py-2 text-sm outline-none focus:border-brand-400";

export default async function AdminPromoCodes({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const codes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  const editCode = edit ? codes.find((c) => c.id === edit) : null;

  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl font-semibold text-brand-900">Promo Codes</h1>

      {/* Edit form */}
      {editCode && (
        <form action={updatePromoCode} className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-semibold text-brand-900">Edit: <span className="font-mono tracking-widest">{editCode.code}</span></h2>
            <a href="/admin/promo-codes" className="text-sm text-foreground/50 hover:text-foreground">✕ Close</a>
          </div>
          <input type="hidden" name="id" value={editCode.id} />
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-foreground/60 mb-1">Description</label>
              <input name="description" defaultValue={editCode.description} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/60 mb-1">Type</label>
              <select name="type" defaultValue={editCode.type} className={input}>
                <option value="percentage">Percentage off</option>
                <option value="fixed">Fixed NZD amount off</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/60 mb-1">Value (% or NZD)</label>
              <input name="value" type="number" min="1" defaultValue={editCode.value} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/60 mb-1">Min spend (NZD)</label>
              <input name="minSpend" type="number" min="0" defaultValue={(editCode.minSpendCents / 100).toFixed(2)} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/60 mb-1">Max uses (blank = unlimited)</label>
              <input name="maxUses" type="number" min="1" defaultValue={editCode.maxUses ?? ""} placeholder="Unlimited" className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/60 mb-1">Expires (optional)</label>
              <input name="expiresAt" type="date" defaultValue={editCode.expiresAt ? new Date(editCode.expiresAt).toISOString().slice(0, 10) : ""} className={input} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked={editCode.isActive} /> Active
            </label>
            <button type="submit" className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Save changes
            </button>
          </div>
        </form>
      )}

      {/* Create form */}
      <form action={createPromoCode} className="mt-6 rounded-xl border border-ivory-200 bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-brand-900">Create promo code</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1">Code *</label>
            <input name="code" required placeholder="SUMMER20" className="w-full rounded-lg border border-ivory-200 px-3 py-2 text-sm uppercase tracking-widest outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1">Description</label>
            <input name="description" placeholder="Summer 2026 promo" className="w-full rounded-lg border border-ivory-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1">Type</label>
            <select name="type" className="w-full rounded-lg border border-ivory-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
              <option value="percentage">Percentage off</option>
              <option value="fixed">Fixed NZD amount off</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1">Value (% or NZD)</label>
            <input name="value" type="number" min="1" required placeholder="20" className="w-full rounded-lg border border-ivory-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1">Min spend (NZD)</label>
            <input name="minSpend" type="number" min="0" placeholder="0" defaultValue="0" className="w-full rounded-lg border border-ivory-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1">Max uses (blank = unlimited)</label>
            <input name="maxUses" type="number" min="1" placeholder="Unlimited" className="w-full rounded-lg border border-ivory-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1">Expires (optional)</label>
            <input name="expiresAt" type="date" className="w-full rounded-lg border border-ivory-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </div>
        </div>
        <button type="submit" className="mt-4 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Create code
        </button>
      </form>

      {/* Codes table */}
      <div className="mt-8 overflow-x-auto rounded-xl border border-ivory-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-ivory text-left text-foreground/60">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Description</th>
              <th className="p-3">Discount</th>
              <th className="p-3">Min Spend</th>
              <th className="p-3">Uses</th>
              <th className="p-3">Expires</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-foreground/50">No promo codes yet.</td></tr>
            )}
            {codes.map((c) => (
              <tr key={c.id} className="border-t border-ivory-200">
                <td className="p-3 font-mono font-semibold tracking-widest text-brand-700">{c.code}</td>
                <td className="p-3 text-foreground/70">{c.description || "—"}</td>
                <td className="p-3">
                  {c.type === "percentage" ? `${c.value}%` : formatNZD(c.value)} off
                </td>
                <td className="p-3">{c.minSpendCents > 0 ? formatNZD(c.minSpendCents) : "None"}</td>
                <td className="p-3">
                  {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}
                </td>
                <td className="p-3 text-foreground/70">
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-NZ") : "Never"}
                </td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3 flex gap-3">
                  <a href={`?edit=${c.id}`} className="text-xs text-brand-600 hover:underline">Edit</a>
                  <form action={togglePromoCode}>
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" className="text-xs text-foreground/50 hover:text-foreground hover:underline">
                      {c.isActive ? "Disable" : "Enable"}
                    </button>
                  </form>
                  <form action={deletePromoCode} onSubmit={(e) => { if (!confirm("Delete this promo code?")) e.preventDefault(); }}>
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" className="text-xs text-red-500 hover:underline">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
