import { prisma } from "@/lib/db";
import { formatNZD } from "@/lib/money";
import { dateLabel } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers" };

export default async function AdminCustomers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { bookings: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  const rows = customers.map((c) => ({
    ...c,
    totalSpentCents: c.bookings
      .filter((b) => b.status === "CONFIRMED")
      .reduce((s, b) => s + b.totalCents, 0),
    bookingCount: c.bookings.length,
    lastBooking: c.bookings[0] ?? null,
  }));

  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl font-semibold text-brand-900">Customers</h1>

      <form method="get" className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="flex-1 rounded-lg border border-ivory-200 bg-white px-4 py-2 text-sm outline-none focus:border-brand-400"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Search
        </button>
        {q && (
          <a
            href="/admin/customers"
            className="rounded-lg border border-ivory-200 px-4 py-2 text-sm hover:bg-ivory"
          >
            Clear
          </a>
        )}
      </form>
      <p className="mt-2 text-sm text-foreground/50">
        {rows.length} customer{rows.length !== 1 ? "s" : ""}
        {q ? ` matching "${q}"` : " total"}
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-ivory-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-ivory text-left text-foreground/60">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Bookings</th>
              <th className="p-3">Total Spent</th>
              <th className="p-3">Last Booking</th>
              <th className="p-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-foreground/50">
                  No customers found.
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-ivory-200">
                <td className="p-3 font-medium">{c.fullName}</td>
                <td className="p-3 text-foreground/70">{c.email}</td>
                <td className="p-3 text-foreground/70">{c.phone ?? "—"}</td>
                <td className="p-3">{c.bookingCount}</td>
                <td className="p-3 font-medium text-brand-700">{formatNZD(c.totalSpentCents)}</td>
                <td className="p-3 text-foreground/70">
                  {c.lastBooking ? dateLabel(c.lastBooking.createdAt) : "—"}
                </td>
                <td className="p-3 text-foreground/50 text-xs">{dateLabel(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
