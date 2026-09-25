"use client";

import { TaskShell } from "@/components/TaskShell";
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
      <TaskShell eyebrow="Sign in" title="Check your email">
        <div className="flex h-14 w-14 items-center justify-center border border-[#202b2640]">
          <svg aria-hidden="true" className="h-7 w-7 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="mt-6 text-foreground/80">
          We sent a sign-in link to <strong className="text-foreground">{email}</strong>.<br />
          Click the link to access your bookings. It expires in 15 minutes.
        </p>
        <p className="mt-6 text-xs text-foreground/75">
          Didn&apos;t receive it?{" "}
          <button onClick={() => { setSent(false); }} className="font-semibold text-foreground underline underline-offset-4">Try again</button>
        </p>
      </TaskShell>
    );
  }

  return (
    <TaskShell eyebrow="Sign in" title="My account" intro="Enter your email to receive a secure sign-in link. No password needed.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-foreground">Email address</label>
          <input
            id="login-email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-[#202b2640] bg-white px-3 py-3 text-sm focus:border-foreground focus:outline-none"
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
          {loading ? "Sending link…" : "Send sign-in link"}
        </button>
      </form>
      <p className="mt-8 border-t border-[#202b2626] pt-5 text-sm text-foreground/80">
        Looking for a booking without signing in?{" "}
        <Link href="/booking/lookup" className="font-semibold text-foreground underline underline-offset-4">Find my booking</Link>
      </p>
    </TaskShell>
  );
}
