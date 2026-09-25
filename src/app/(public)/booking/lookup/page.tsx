"use client";

import { TaskShell } from "@/components/TaskShell";
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
  CANCELLED: { label: "Cancelled", className: "text-foreground/75 bg-ivory" },
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

  const field = "w-full border border-[#202b2640] bg-white px-3 py-3 text-sm focus:border-foreground focus:outline-none";

  return (
    <TaskShell eyebrow="Your booking" title="Find my booking" intro="Enter the email address you booked with and your booking reference (for example KJ-AB1234).">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="lookup-email" className="mb-1.5 block text-sm font-medium text-foreground">Email address</label>
          <input
            id="lookup-email"
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
          <label htmlFor="lookup-reference" className="mb-1.5 block text-sm font-medium text-foreground">Booking reference</label>
          <input
            id="lookup-reference"
            className={field}
            placeholder="KJ-XXXXXX"
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            required
          />
        </div>
        {error && (
          <p role="alert" className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex min-h-12 w-full items-center justify-center bg-[#203c33] px-6 font-semibold text-white transition hover:bg-[#315445] disabled:opacity-50"
        >
          {loading ? "Searching…" : "Find booking"}
        </button>
      </form>

      {result && (
        <div className="mt-8 border-t-2 border-foreground bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground/75">Booking found</p>
            {STATUS_LABEL[result.status] && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_LABEL[result.status].className}`}>
                {STATUS_LABEL[result.status].label}
              </span>
            )}
          </div>
          <h2 className="mt-3 font-serif text-xl font-semibold text-foreground">{result.tourTitle}</h2>
          <p className="mt-1 text-sm text-foreground/75">{formatDate(result.startsAtUtc)}</p>
          <div className="mt-4 space-y-2 border-t border-[#202b2626] pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/75">Reference</span>
              <span className="font-medium">{result.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/75">Guests</span>
              <span className="font-medium">{result.seats}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/75">Total paid</span>
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

      <p className="mt-8 text-center text-xs text-foreground/75">
        Can&apos;t find your booking?{" "}
        <Link href="/contact" className="text-brand-600 underline">Contact us</Link> and we&apos;ll help.
      </p>
    </TaskShell>
  );
}
