import { prisma } from "@/lib/db";
import { formatNZD } from "@/lib/money";
import { dateLabel, timeLabel } from "@/lib/time";
import { RefundButton } from "@/components/AdminActions";
import { StatusPill } from "../page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bookings" };

export default async function AdminBookings() {
  const bookings = await prisma.booking.findMany({
    include: { session: { include: { tour: true } }, customer: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl font-semibold text-brand-900">Bookings</h1>
      <div className="mt-6 overflow-x-auto rounded-xl border border-ivory-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-ivory text-left text-foreground/60">
            <tr>
              <th className="p-3">Ref</th><th className="p-3">Customer</th><th className="p-3">Tour</th>
              <th className="p-3">Departure</th><th className="p-3">Seats</th><th className="p-3">Total</th>
              <th className="p-3">Status</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-foreground/50">No bookings yet.</td></tr>}
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
