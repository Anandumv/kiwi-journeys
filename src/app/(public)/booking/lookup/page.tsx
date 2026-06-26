"use client";

import { useState } from "react";
import Link from "next/link";
import { formatNZD } from "@/lib/money";

type BookingResult = {
  reference: string;
  status: string;
  seats: number;
  totalCents: number;
  tourTitle: string;
  tourSlug: string;
  startsAtUtc: string;
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: "Confirmed", className: "text-teal-700 bg-teal-50" },
  CANCELLED: { label: "Cancelled", className: "text-foreground/50 bg-ivory" },
  REFUNDED: { label: "Refunded", className: "text-amber-700 bg-amber-50" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Pacific/Auckland",
  });
}

export default function LookupPage() {
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/bookings/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), reference: reference.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const field = "w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-brand-900">Find my booking</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Enter the email address you booked with and your booking reference (e.g. KJ-AB1234).
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-800">Email address</label>
          <input
            className={field}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-800">Booking reference</label>
          <input
            className={field}
            placeholder="KJ-XXXXXX"
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            required
          />
        </div>
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Find booking"}
        </button>
      </form>

      {result && (
        <div className="mt-8 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground/40">Booking found</p>
            {STATUS_LABEL[result.status] && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_LABEL[result.status].className}`}>
                {STATUS_LABEL[result.status].label}
              </span>
            )}
          </div>
          <h2 className="mt-3 font-serif text-xl font-semibold text-brand-900">{result.tourTitle}</h2>
          <p className="mt-1 text-sm text-foreground/60">{formatDate(result.startsAtUtc)}</p>
          <div className="mt-4 space-y-2 border-t border-brand-50 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/60">Reference</span>
              <span className="font-medium">{result.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Guests</span>
              <span className="font-medium">{result.seats}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Total paid</span>
              <span className="font-medium">{formatNZD(result.totalCents)}</span>
            </div>
          </div>
          <Link
            href={`/booking/${result.reference}`}
            className="mt-5 block rounded-full bg-brand-600 px-6 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            View full booking →
          </Link>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-foreground/40">
        Can&apos;t find your booking?{" "}
        <Link href="/contact" className="text-brand-600 underline">Contact us</Link> and we&apos;ll help.
      </p>
    </div>
  );
}
