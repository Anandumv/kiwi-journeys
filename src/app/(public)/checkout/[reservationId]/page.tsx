import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { CheckoutForm } from "@/components/CheckoutForm";
import { formatNZD } from "@/lib/money";
import { timeLabel, dateLabel } from "@/lib/time";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

type CartLine = { label: string; unitPriceCents: number; qty: number };

export default async function CheckoutPage({ params }: { params: Promise<{ reservationId: string }> }) {
  const { reservationId } = await params;

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { session: { include: { tour: true } }, booking: true },
  });
  if (!reservation) notFound();

  // Already paid — send to confirmation.
  if (reservation.status === "CONVERTED" && reservation.booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-lg text-brand-800">This booking is already confirmed.</p>
        <Link href={`/booking/${reservation.booking.reference}`} className="mt-4 inline-block font-semibold text-brand-600 hover:underline">View confirmation →</Link>
      </div>
    );
  }

  const expired = reservation.status !== "HELD" || reservation.expiresAt <= new Date();
  if (expired) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-brand-900">Your seat hold has expired</h1>
        <p className="mt-3 text-foreground/70">Reservations are held for a limited time. Please choose your date and seats again.</p>
        <Link href={`/tours/${reservation.session.tour.slug}/book`} className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
          Start a new booking
        </Link>
      </div>
    );
  }

  const lines = (reservation.cartSnapshot as unknown as CartLine[]) ?? [];

  // Configuration / clientSecret.
  const stripeReady = isStripeConfigured();
  let clientSecret: string | null = null;
  if (stripeReady && reservation.stripePaymentIntentId) {
    try {
      const pi = await getStripe().paymentIntents.retrieve(reservation.stripePaymentIntentId);
      clientSecret = pi.client_secret;
    } catch {
      clientSecret = null;
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-brand-900">Checkout</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1fr]">
        {/* Summary */}
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm lg:order-2 lg:h-fit">
          <h2 className="text-lg font-semibold text-brand-900">{reservation.session.tour.title}</h2>
          <p className="mt-1 text-sm text-foreground/70">{dateLabel(reservation.session.startsAtUtc)}</p>
          <p className="text-sm text-foreground/70">Departs {timeLabel(reservation.session.startsAtUtc)} (NZ time)</p>
          <div className="mt-4 space-y-2 border-t border-brand-50 pt-4">
            {lines.map((l, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-foreground/80">{l.qty} × {l.label}</span>
                <span className="font-medium">{formatNZD(l.unitPriceCents * l.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-brand-50 pt-4 text-lg font-bold text-brand-700">
            <span>Total</span><span>{formatNZD(reservation.totalCents)}</span>
          </div>
          <p className="mt-2 text-xs text-foreground/50">Charged in NZD. Seats held until {timeLabel(reservation.expiresAt)}.</p>
        </div>

        {/* Payment */}
        <div className="lg:order-1">
          <CheckoutForm
            reservationId={reservation.id}
            clientSecret={clientSecret}
            stripeReady={stripeReady}
            expiresAt={reservation.expiresAt.toISOString()}
            tourSlug={reservation.session.tour.slug}
            totalCents={reservation.totalCents}
          />
        </div>
      </div>
    </div>
  );
}
