import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatNZD } from "@/lib/money";
import { dateLabel, timeLabel } from "@/lib/time";
import { RefundButton } from "@/components/AdminActions";
import { StatusPill } from "../page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bookings" };

const STATUSES: BookingStatus[] = ["CONFIRMED", "REFUNDED", "CANCELLED"];

export default async function AdminBookings({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const validStatus = STATUSES.includes(status as BookingStatus) ? (status as BookingStatus) : undefined;

  const bookings = await prisma.booking.findMany({
    where: {
      ...(validStatus && { status: validStatus }),
      ...(q && {
        OR: [
          { reference: { contains: q, mode: "insensitive" } },
          { customer: { fullName: { contains: q, mode: "insensitive" } } },
          { customer: { email: { contains: q, mode: "insensitive" } } },
        ],
      }),
    },
    include: { session: { include: { tour: true } }, customer: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (validStatus) exportParams.set("status", validStatus);
  const exportHref = `/api/admin/bookings/export${exportParams.size ? `?${exportParams}` : ""}`;

  return (
    <div className="p-8">
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-3xl font-semibold text-brand-900">Bookings</h1>
        <a href={exportHref} className="rounded-lg border border-ivory-200 bg-white px-4 py-2 text-sm hover:bg-ivory">
          Export CSV
        </a>
      </div>

      <form method="get" className="mt-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search reference, name, or email…"
          className="min-w-48 flex-1 rounded-lg border border-ivory-200 bg-white px-4 py-2 text-sm outline-none focus:border-brand-400"
        />
        <select name="status" defaultValue={status ?? ""} className="rounded-lg border border-ivory-200 bg-white px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Filter</button>
        {(q || status) && (
          <a href="/admin/bookings" className="rounded-lg border border-ivory-200 px-4 py-2 text-sm hover:bg-ivory">Clear</a>
        )}
      </form>
      <p className="mt-2 text-sm text-foreground/50">
        {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
        {q ? ` matching "${q}"` : ""}
        {validStatus ? ` · ${validStatus}` : ""}
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-ivory-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-ivory text-left text-foreground/60">
            <tr>
              <th className="p-3">Ref</th><th className="p-3">Customer</th><th className="p-3">Tour</th>
              <th className="p-3">Departure</th><th className="p-3">Seats</th><th className="p-3">Total</th>
              <th className="p-3">Status</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-foreground/50">No bookings found.</td></tr>}
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-ivory-200">
                <td className="p-3 font-mono text-xs">{b.reference}</td>
                <td className="p-3">{b.customer.fullName}<br /><span className="text-xs text-foreground/50">{b.customer.email}</span></td>
                <td className="p-3">{b.session.tour.title}</td>
                <td className="p-3 text-foreground/70">{dateLabel(b.session.startsAtUtc)}<br /><span className="text-xs">{timeLabel(b.session.startsAtUtc)}</span></td>
                <td className="p-3">{b.seats}</td>
                <td className="p-3">{formatNZD(b.totalCents)}</td>
                <td className="p-3"><StatusPill status={b.status} /></td>
                <td className="p-3"><RefundButton id={b.id} disabled={b.status !== "CONFIRMED"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
