"use client";

import { useState } from "react";
import Link from "next/link";

export default function UnsubscribeClient({ e }: { e: string }) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ e }),
      });
      if (res.ok) setDone(true);
      else setError("Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!e) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-foreground/60">Invalid unsubscribe link. Please use the link from your email.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="text-5xl">✓</div>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-brand-900">You&apos;ve been unsubscribed</h1>
        <p className="mt-2 text-sm text-foreground/60">
          You won&apos;t receive any more marketing emails from us. We&apos;re sorry to see you go!
        </p>
        <Link
          href="/tours"
          className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline"
        >
          Browse our tours →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-serif text-2xl font-semibold text-brand-900">Unsubscribe</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Are you sure you want to unsubscribe from our newsletter?
      </p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-8 flex justify-center gap-3">
        <button
          onClick={confirm}
          disabled={loading}
          className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Processing…" : "Yes, unsubscribe me"}
        </button>
        <Link
          href="/"
          className="rounded-full border border-ivory-200 px-6 py-2.5 text-sm font-semibold hover:bg-ivory"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
