"use client";

import { useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { formatNZD } from "@/lib/money";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: Promise<Stripe | null> | null = null;
function getStripePromise() {
  if (!stripePromise && pk && pk !== "pk_test_xxx") stripePromise = loadStripe(pk);
  return stripePromise;
}

const PRESET_AMOUNTS = [5000, 10000, 15000, 20000]; // $50, $100, $150, $200 NZD cents

function GiftVoucherPayment({
  amountCents,
  purchaserName,
}: {
  amountCents: number;
  purchaserName: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error: payErr } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/gift-vouchers/success`,
      },
    });
    if (payErr) {
      setError(payErr.message || "Payment failed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-sm text-foreground/70">
        Paying <strong className="text-brand-800">{formatNZD(amountCents)} NZD</strong> — gift voucher for {purchaserName}.
      </div>
      <div className="rounded-xl border border-brand-100 p-4">
        <PaymentElement />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "Processing…" : `Pay ${formatNZD(amountCents)}`}
      </button>
    </form>
  );
}

export function GiftVoucherForm() {
  const [step, setStep] = useState<"details" | "payment">("details");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [form, setForm] = useState({
    purchaserName: "",
    purchaserEmail: "",
    recipientName: "",
    recipientEmail: "",
    message: "",
    customAmount: "",
  });
  const [selectedPreset, setSelectedPreset] = useState<number | null>(10000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountCents = selectedPreset ?? (Math.round(Number(form.customAmount) * 100) || 0);
  const field =
    "w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none";

  async function proceedToPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!form.purchaserName || !form.purchaserEmail) {
      setError("Please enter your name and email.");
      return;
    }
    if (amountCents < 5000) {
      setError("Minimum voucher value is NZD $50.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/gift-vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          purchaserName: form.purchaserName,
          purchaserEmail: form.purchaserEmail,
          recipientName: form.recipientName || undefined,
          recipientEmail: form.recipientEmail || undefined,
          message: form.message || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Could not set up payment. Please try again.");
        return;
      }
      if (!d.stripeConfigured) {
        setError("Payments are not configured. Please contact us to purchase a gift voucher.");
        return;
      }
      setClientSecret(d.clientSecret);
      setStep("payment");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "payment" && clientSecret) {
    return (
      <Elements
        stripe={getStripePromise()}
        options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#137264" } } }}
      >
        <GiftVoucherPayment amountCents={amountCents} purchaserName={form.purchaserName} />
      </Elements>
    );
  }

  return (
    <form onSubmit={proceedToPayment} className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-3">
          Voucher value
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESET_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => { setSelectedPreset(a); setForm({ ...form, customAmount: "" }); }}
              className={`rounded-xl border py-3 text-sm font-semibold transition ${
                selectedPreset === a
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-brand-100 hover:border-brand-300"
              }`}
            >
              {formatNZD(a)}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-foreground/50">or enter custom:</span>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-sm text-foreground/50">NZD $</span>
            <input
              type="number"
              min="50"
              max="2000"
              step="1"
              className="w-28 rounded-lg border border-brand-200 pl-14 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              placeholder="e.g. 75"
              value={form.customAmount}
              onChange={(e) => { setForm({ ...form, customAmount: e.target.value }); setSelectedPreset(null); }}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-3">
          Your details
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={field}
            required
            placeholder="Your full name"
            value={form.purchaserName}
            onChange={(e) => setForm({ ...form, purchaserName: e.target.value })}
          />
          <input
            className={field}
            type="email"
            required
            placeholder="Your email"
            value={form.purchaserEmail}
            onChange={(e) => setForm({ ...form, purchaserEmail: e.target.value })}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-3">
          Recipient (optional)
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={field}
            placeholder="Recipient's name"
            value={form.recipientName}
            onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
          />
          <input
            className={field}
            type="email"
            placeholder="Recipient's email (to send them the code)"
            value={form.recipientEmail}
            onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
          />
        </div>
        <textarea
          className={`${field} mt-3`}
          rows={2}
          placeholder="Personal message (optional)"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || amountCents < 5000}
        className="w-full rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting
          ? "Setting up…"
          : `Continue to payment — ${amountCents >= 5000 ? formatNZD(amountCents) : "NZD $50 min"}`}
      </button>
    </form>
  );
}
