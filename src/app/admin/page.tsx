import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatNZD } from "@/lib/money";
import { dateLabel, timeLabel } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminDashboard() {
  const now = new Date();
  const [bookings, heldCount, revenue, tourCount, upcoming] = await Promise.all([
    prisma.booking.findMany({ include: { session: { include: { tour: true } } }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.reservation.count({ where: { status: "HELD", expiresAt: { gt: now } } }),
    prisma.booking.aggregate({ where: { status: "CONFIRMED" }, _sum: { totalCents: true }, _count: true }),
    prisma.tour.count(),
    prisma.session.count({ where: { startsAtUtc: { gt: now }, status: "SCHEDULED" } }),
  ]);

  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl font-semibold text-brand-900">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Confirmed bookings" value={String(revenue._count)} />
        <Stat label="Revenue (confirmed)" value={formatNZD(revenue._sum.totalCents ?? 0)} />
        <Stat label="Active holds" value={String(heldCount)} />
        <Stat label="Upcoming departures" value={String(upcoming)} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-brand-900">Recent bookings</h2>
        <Link href="/admin/bookings" className="text-sm font-semibold text-brand-600 hover:underline">All bookings →</Link>
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-ivory-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-ivory text-left text-foreground/60">
            <tr><th className="p-3">Ref</th><th className="p-3">Tour</th><th className="p-3">Departure</th><th className="p-3">Total</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {bookings.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-foreground/50">No bookings yet.</td></tr>}
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-ivory-200">
                <td className="p-3 font-mono text-xs">{b.reference}</td>
                <td className="p-3">{b.session.tour.title}</td>
                <td className="p-3 text-foreground/70">{dateLabel(b.session.startsAtUtc)} · {timeLabel(b.session.startsAtUtc)}</td>
                <td className="p-3">{formatNZD(b.totalCents)}</td>
                <td className="p-3"><StatusPill status={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-sm text-foreground/55">{tourCount} tours · Manage everything from the sidebar.</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ivory-200 bg-white p-4">
      <div className="font-serif text-2xl font-semibold text-brand-700">{value}</div>
      <div className="mt-1 text-xs text-foreground/55">{label}</div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const cls = status === "CONFIRMED" ? "bg-brand-100 text-brand-700" : status === "REFUNDED" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}
