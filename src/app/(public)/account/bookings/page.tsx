import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customerAuth";
import { prisma } from "@/lib/db";
import { formatNZD } from "@/lib/money";
import { dateLabel } from "@/lib/time";

export const metadata: Metadata = { title: "My Bookings" };
export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: "Confirmed", className: "bg-teal-100 text-teal-800" },
  CANCELLED: { label: "Cancelled", className: "bg-ivory text-foreground/50" },
  REFUNDED: { label: "Refunded", className: "bg-amber-100 text-amber-800" },
};

export default async function MyBookingsPage() {
  const session = await getCurrentCustomer();
  if (!session) redirect("/account/login");

  const bookings = await prisma.booking.findMany({
    where: { customer: { email: session.email } },
    include: { session: { include: { tour: true } } },
    orderBy: { session: { startsAtUtc: "desc" } },
  });

  const now = new Date();
  const upcoming = bookings.filter((b) => b.session.startsAtUtc > now && b.status === "CONFIRMED");
  const past = bookings.filter((b) => b.session.startsAtUtc <= now || b.status !== "CONFIRMED");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand-900">My bookings</h1>
          {session.name && <p className="mt-1 text-sm text-foreground/60">Signed in as {session.name}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/account/profile" className="text-sm font-medium text-brand-600 hover:underline">
            Profile
          </Link>
          <form action="/api/account/logout" method="POST">
            <button type="submit" className="text-sm text-foreground/50 hover:text-foreground/80">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {bookings.length === 0 && (
        <div className="mt-12 rounded-2xl border border-dashed border-brand-200 py-16 text-center">
          <p className="text-foreground/50">No bookings found for {session.email}.</p>
          <Link href="/tours" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline">
            Browse tours →
          </Link>
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground/40">Upcoming</h2>
          <div className="mt-3 space-y-3">
            {upcoming.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground/40">Past &amp; other</h2>
          <div className="mt-3 space-y-3">
            {past.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BookingRow({ booking }: {
  booking: {
    reference: string;
    status: string;
    seats: number;
    totalCents: number;
    session: { startsAtUtc: Date; tour: { title: string } };
  };
}) {
  const st = STATUS[booking.status] ?? { label: booking.status, className: "bg-ivory text-foreground/50" };
  return (
    <Link
      href={`/account/bookings/${booking.reference}`}
      className="flex items-center justify-between rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
    >
      <div>
        <p className="font-medium text-brand-900">{booking.session.tour.title}</p>
        <p className="mt-0.5 text-sm text-foreground/60">{dateLabel(booking.session.startsAtUtc)}</p>
        <p className="mt-0.5 text-xs text-foreground/40">
          {booking.seats} guest{booking.seats !== 1 ? "s" : ""} · {booking.reference}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.className}`}>{st.label}</span>
        <span className="text-sm font-medium text-brand-700">{formatNZD(booking.totalCents)}</span>
      </div>
    </Link>
  );
}
