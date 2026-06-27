"use client";

import { useState } from "react";
import Link from "next/link";

export default function AccountLoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
          <svg className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="mt-5 font-serif text-2xl font-semibold text-brand-900">Check your email</h1>
        <p className="mt-3 text-sm text-foreground/60">
          We sent a sign-in link to <strong className="text-brand-800">{email}</strong>.<br />
          Click the link to access your bookings. It expires in 15 minutes.
        </p>
        <p className="mt-6 text-xs text-foreground/40">
          Didn&apos;t receive it?{" "}
          <button onClick={() => { setSent(false); }} className="text-brand-600 underline">Try again</button>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-brand-900">My account</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Enter your email to receive a secure sign-in link — no password needed.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-800">Email address</label>
          <input
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
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
          {loading ? "Sending link…" : "Send sign-in link"}
        </button>
      </form>
      <p className="mt-8 text-center text-xs text-foreground/40">
        Looking for a booking without signing in?{" "}
        <Link href="/booking/lookup" className="text-brand-600 underline">Find my booking</Link>
      </p>
    </div>
  );
}
