import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatNZD } from "@/lib/money";
import { dateLabel, timeLabel } from "@/lib/time";
import { getSiteSettings } from "@/lib/content";

export const metadata: Metadata = { title: "Booking Confirmed" };
export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
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
      <div className="rounded-2xl border border-brand-100 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-2xl text-brand-700">✓</div>
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Booking confirmed!</h1>
            <p className="text-sm text-foreground/60">Reference <span className="font-semibold text-brand-700">{booking.reference}</span></p>
          </div>
        </div>

        <div className="mt-8 space-y-1">
          <h2 className="text-lg font-semibold text-brand-900">{booking.session.tour.title}</h2>
          <p className="text-sm text-foreground/70">{dateLabel(booking.session.startsAtUtc)}</p>
          <p className="text-sm text-foreground/70">Departs {timeLabel(booking.session.startsAtUtc)} (NZ time)</p>
        </div>

        <div className="mt-6 space-y-2 border-t border-brand-50 pt-4">
          {booking.items.map((it) => (
            <div key={it.id} className="flex justify-between text-sm">
              <span className="text-foreground/80">{it.qty} × {it.label}</span>
              <span className="font-medium">{formatNZD(it.unitPriceCents * it.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-brand-50 pt-3 text-lg font-bold text-brand-700">
            <span>Total paid</span><span>{formatNZD(booking.totalCents)}</span>
          </div>
        </div>

        {booking.status === "REFUNDED" && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">This booking has been refunded.</p>
        )}

        <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm text-foreground/70">
          A confirmation has been sent to <strong>{booking.customer.email}</strong>. Questions? Call us at{" "}
          <a href={site.phoneHref} className="font-semibold text-brand-600">{site.phone}</a>.
        </div>

        <Link href="/tours" className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
          Browse more tours
        </Link>
      </div>
    </div>
  );
}
