import { cookies } from "next/headers";
import { BOOKING_VIEW_COOKIE, verifyBookingAccess } from "@/lib/bookingAccess";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatNZD } from "@/lib/money";
import { dateLabel, timeLabel } from "@/lib/time";
import { getSiteSettings } from "@/lib/content";

export const metadata: Metadata = { title: "Booking details", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const token = (await cookies()).get(BOOKING_VIEW_COOKIE)?.value;
  if (!token || !(await verifyBookingAccess(token, reference))) redirect("/booking/lookup");
  const [booking, site] = await Promise.all([
    prisma.booking.findUnique({
      where: { reference },
      include: { items: true, session: { include: { tour: true } }, customer: true },
    }),
    getSiteSettings(),
  ]);
  if (!booking) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-[#202b2626] bg-white p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-2xl text-brand-700">✓</div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{booking.status === "CONFIRMED" ? "Booking confirmed!" : booking.status === "REFUNDED" ? "Booking refunded" : "Booking cancelled"}</h1>
            <p className="text-sm text-foreground/75">Reference <span className="font-semibold text-brand-700">{booking.reference}</span></p>
          </div>
        </div>

        <div className="mt-8 space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{booking.session.tour.title}</h2>
          <p className="text-sm text-foreground/75">{dateLabel(booking.session.startsAtUtc)}</p>
          <p className="text-sm text-foreground/75">Departs {timeLabel(booking.session.startsAtUtc)} (NZ time)</p>
        </div>

        <div className="mt-6 space-y-2 border-t border-[#202b2626] pt-4">
          {booking.items.map((it) => (
            <div key={it.id} className="flex justify-between text-sm">
              <span className="text-foreground/80">{it.qty} × {it.label}</span>
              <span className="font-medium">{formatNZD(it.unitPriceCents * it.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-[#202b2626] pt-3 text-lg font-bold text-brand-700">
            <span>Total paid</span><span>{formatNZD(booking.totalCents)}</span>
          </div>
        </div>

        {booking.status === "REFUNDED" && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">This booking has been refunded.</p>
        )}

        <div className="mt-6 rounded-xl bg-[#eeede6] p-4 text-sm text-foreground/75">
          Keep your booking reference for your records. Questions? Call us at{" "}
          <a href={site.phoneHref} className="font-semibold text-brand-600">{site.phone}</a>.
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/tours" className="inline-block rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
            Browse more tours
          </Link>
          <Link href="/account/login" className="inline-block rounded-full border border-[#202b2640] px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-[#eeede6]">
            View my bookings
          </Link>
        </div>
        <div className="mt-4 rounded-xl border border-[#202b2626] bg-[#eeede6] p-4 text-sm">
          <p className="font-semibold text-foreground">Personalise your experience</p>
          <p className="mt-1 text-foreground/75">Save your travel preferences and manage all your bookings in one place.</p>
          <Link href="/account/login" className="mt-2 inline-block font-semibold text-brand-600 hover:underline">Set up your account →</Link>
        </div>
      </div>
    </div>
  );
}
