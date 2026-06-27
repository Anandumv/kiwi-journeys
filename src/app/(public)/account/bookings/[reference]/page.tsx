import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customerAuth";
import { prisma } from "@/lib/db";
import { formatNZD } from "@/lib/money";
import { dateLabel, timeLabel } from "@/lib/time";
import { UpdateNotesForm, CancelRequestButton } from "@/components/account/BookingActions";
import { RescheduleForm } from "@/components/account/RescheduleForm";

export const metadata: Metadata = { title: "Booking detail" };
export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: "Confirmed", className: "bg-teal-100 text-teal-800" },
  CANCELLED: { label: "Cancelled", className: "bg-ivory text-foreground/50" },
  REFUNDED: { label: "Refunded", className: "bg-amber-100 text-amber-800" },
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const session = await getCurrentCustomer();
  if (!session) redirect("/account/login");

  const booking = await prisma.booking.findFirst({
    where: { reference, customer: { email: session.email } },
    include: {
      session: { include: { tour: true } },
      items: { orderBy: { id: "asc" } },
    },
  });
  if (!booking) notFound();

  const now = new Date();
  const isPast = booking.session.startsAtUtc <= now;
  const hoursUntilDeparture = (booking.session.startsAtUtc.getTime() - now.getTime()) / (1000 * 60 * 60);
  const canUpdateNotes = !isPast && booking.status === "CONFIRMED" && hoursUntilDeparture >= 48;
  const canCancel = !isPast && booking.status === "CONFIRMED";
  const canReschedule = !isPast && booking.status === "CONFIRMED" && hoursUntilDeparture >= 48;

  const st = STATUS[booking.status] ?? { label: booking.status, className: "bg-ivory text-foreground/50" };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/account/bookings" className="text-sm text-brand-600 hover:underline">
        ← My bookings
      </Link>

      <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground/40">
              {booking.reference}
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-brand-900">
              {booking.session.tour.title}
            </h1>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${st.className}`}>
            {st.label}
          </span>
        </div>

        <div className="mt-4 space-y-1 text-sm text-foreground/70">
          <p>{dateLabel(booking.session.startsAtUtc)}</p>
          <p>Departs {timeLabel(booking.session.startsAtUtc)} (NZ time)</p>
          <p>{booking.seats} guest{booking.seats !== 1 ? "s" : ""}</p>
        </div>

        <div className="mt-5 space-y-2 border-t border-brand-50 pt-5">
          {booking.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-foreground/70">{item.qty} × {item.label}</span>
              <span className="font-medium">{formatNZD(item.unitPriceCents * item.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-brand-50 pt-3 font-semibold text-brand-700">
            <span>Total paid</span>
            <span>{formatNZD(booking.totalCents)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm space-y-5">
        <UpdateNotesForm
          reference={booking.reference}
          initialNotes={booking.notes ?? ""}
          canEdit={canUpdateNotes}
        />

        {canReschedule && (
          <div className="border-t border-brand-50 pt-5">
            <p className="text-sm font-medium text-brand-800 mb-2">Change your date</p>
            <p className="text-xs text-foreground/50 mb-3">
              Reschedule to any available date for the same tour.
            </p>
            <RescheduleForm
              reference={booking.reference}
              tourSlug={booking.session.tour.slug}
              seats={booking.seats}
            />
          </div>
        )}

        {canCancel && (
          <div className="border-t border-brand-50 pt-5">
            <CancelRequestButton
              reference={booking.reference}
              hoursUntilDeparture={hoursUntilDeparture}
            />
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-foreground/40">
        Questions?{" "}
        <Link href="/contact" className="text-brand-600 underline">Contact us</Link>
      </p>
    </div>
  );
}
