"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { formatNZD } from "@/lib/money";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: Promise<Stripe | null> | null = null;
function getStripePromise() {
  if (!stripePromise && pk && pk !== "pk_test_xxx") stripePromise = loadStripe(pk);
  return stripePromise;
}

function Countdown({ expiresAt }: { expiresAt: string }) {
  const target = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
  const [left, setLeft] = useState(() => Math.max(0, target - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);
  const mins = Math.floor(left / 60000);
  const secs = Math.floor((left % 60000) / 1000);
  if (left <= 0) return <span className="text-red-600">expired</span>;
  return <span className="font-semibold tabular-nums">{mins}:{String(secs).padStart(2, "0")}</span>;
}

function ContactFields({
  contact,
  setContact,
}: {
  contact: { fullName: string; email: string; phone: string; notes: string };
  setContact: (c: typeof contact) => void;
}) {
  const field = "w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none";
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={field} placeholder="Full name" value={contact.fullName} onChange={(e) => setContact({ ...contact, fullName: e.target.value })} required />
        <input className={field} type="email" placeholder="Email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} required />
      </div>
      <input className={field} placeholder="Phone (optional)" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
      <textarea className={field} rows={2} placeholder="Pickup hotel / notes (optional)" value={contact.notes} onChange={(e) => setContact({ ...contact, notes: e.target.value })} />
    </div>
  );
}

type PromoResult = {
  valid: boolean;
  discountCents?: number;
  promoId?: string;
  message: string;
};

function PaymentInner({
  reservationId,
  expiresAt,
  totalCents,
}: {
  reservationId: string;
  expiresAt: string;
  totalCents: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [contact, setContact] = useState({ fullName: "", email: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const [giftVoucherCode, setGiftVoucherCode] = useState("");
  type VoucherResult = { valid: boolean; voucherId?: string; voucherCode?: string; discountCents?: number; message: string };
  const [voucherResult, setVoucherResult] = useState<VoucherResult | null>(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const [marketingConsent, setMarketingConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  async function applyVoucher() {
    if (!giftVoucherCode.trim()) return;
    setApplyingVoucher(true);
    setVoucherResult(null);
    try {
      const res = await fetch("/api/gift-vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftVoucherCode.trim(), totalCents }),
      });
      const data = await res.json();
      setVoucherResult(data);
    } catch {
      setVoucherResult({ valid: false, message: "Could not apply voucher. Try again." });
    } finally {
      setApplyingVoucher(false);
    }
  }

  async function applyPromo() {
    if (!promoCode.trim()) return;
    setApplyingPromo(true);
    setPromoResult(null);
    try {
      const res = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), totalCents }),
      });
      const data = await res.json();
      setPromoResult(data);
    } catch {
      setPromoResult({ valid: false, message: "Could not apply code. Try again." });
    } finally {
      setApplyingPromo(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!contact.fullName || !contact.email) {
      setError("Please enter your name and email.");
      return;
    }
    if (!termsAccepted) {
      setError("Please accept the Terms & Conditions to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const c = await fetch(`/api/reservations/${reservationId}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...contact,
        marketingConsent,
        promoCodeId: promoResult?.valid ? promoResult.promoId : undefined,
        giftVoucherCode: voucherResult?.valid ? voucherResult.voucherCode : undefined,
        giftVoucherDiscountCents: voucherResult?.valid ? (voucherResult.discountCents ?? 0) : 0,
      }),
    });
    if (!c.ok) {
      const d = await c.json().catch(() => ({}));
      setError(d.error || "Could not save your details.");
      setSubmitting(false);
      return;
    }

    const { error: payErr } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/processing?reservation=${reservationId}`,
        receipt_email: contact.email,
      },
    });
    if (payErr) {
      setError(payErr.message || "Payment failed. Please try again.");
      setSubmitting(false);
    }
    // On success Stripe redirects to return_url.
  }

  const promoDiscount = promoResult?.valid ? (promoResult.discountCents ?? 0) : 0;
  const voucherDiscount = voucherResult?.valid ? (voucherResult.discountCents ?? 0) : 0;
  const discountCents = promoDiscount + voucherDiscount;
  const finalCents = Math.max(100, totalCents - discountCents);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-brand-900">Your details</h2>
        <div className="mt-3"><ContactFields contact={contact} setContact={setContact} /></div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-brand-900">Promo code</h2>
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            placeholder="Enter code"
            value={promoCode}
            onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
          />
          <button
            type="button"
            onClick={applyPromo}
            disabled={applyingPromo || !promoCode.trim()}
            className="rounded-lg border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
          >
            {applyingPromo ? "…" : "Apply"}
          </button>
        </div>
        {promoResult && (
          <p className={`mt-2 text-sm ${promoResult.valid ? "text-teal-700" : "text-red-600"}`}>
            {promoResult.message}
          </p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-brand-900">Gift voucher</h2>
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            placeholder="GV-XXXXXXXX"
            value={giftVoucherCode}
            onChange={(e) => { setGiftVoucherCode(e.target.value.toUpperCase()); setVoucherResult(null); }}
          />
          <button
            type="button"
            onClick={applyVoucher}
            disabled={applyingVoucher || !giftVoucherCode.trim()}
            className="rounded-lg border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
          >
            {applyingVoucher ? "…" : "Apply"}
          </button>
        </div>
        {voucherResult && (
          <p className={`mt-2 text-sm ${voucherResult.valid ? "text-teal-700" : "text-red-600"}`}>
            {voucherResult.message}
          </p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-brand-900">Payment</h2>
        <div className="mt-3 rounded-xl border border-brand-100 p-4">
          <PaymentElement />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
            checked={marketingConsent}
            onChange={(e) => setMarketingConsent(e.target.checked)}
          />
          <span className="text-sm text-foreground/70">
            Send me travel inspiration, special offers, and tour news. You can unsubscribe at any time.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <span className="text-sm text-foreground/70">
            I agree to the{" "}
            <a href="/terms-of-use" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
              Terms &amp; Conditions
            </a>{" "}
            and{" "}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
              Privacy Policy
            </a>
            . <span className="text-red-500">*</span>
          </span>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between text-sm text-foreground/60">
        <span>Seats held for <Countdown expiresAt={expiresAt} /></span>
        {discountCents > 0 && (
          <span className="font-medium text-teal-700">Saving {formatNZD(discountCents)}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={!stripe || submitting || !termsAccepted}
        className="w-full rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "Processing…" : discountCents > 0 ? `Pay ${formatNZD(finalCents)}` : "Pay now"}
      </button>
    </form>
  );
}

export function CheckoutForm({
  reservationId,
  clientSecret,
  stripeReady,
  expiresAt,
  tourSlug,
  totalCents,
}: {
  reservationId: string;
  clientSecret: string | null;
  stripeReady: boolean;
  expiresAt: string;
  tourSlug: string;
  totalCents: number;
}) {
  if (!stripeReady || !clientSecret) {
    return (
      <div className="rounded-2xl border border-sand-400/50 bg-sand-400/10 p-6">
        <h2 className="font-semibold text-brand-900">Payments not configured yet</h2>
        <p className="mt-2 text-sm text-foreground/70">
          Add your Stripe test keys to <code className="rounded bg-white px-1">.env</code>
          (<code className="rounded bg-white px-1">STRIPE_SECRET_KEY</code>,
          <code className="rounded bg-white px-1">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>) and restart the
          dev server to enable online payment. Your seat hold for <strong>{tourSlug}</strong> is reserved
          in the meantime.
        </p>
      </div>
    );
  }

  const promise = getStripePromise();
  return (
    <Elements stripe={promise} options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#137264" } } }}>
      <PaymentInner reservationId={reservationId} expiresAt={expiresAt} totalCents={totalCents} />
    </Elements>
  );
}
