"use client";

import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="border-y border-ivory-200 bg-white/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            A few notes from the South Island
          </h2>
          <p className="mt-2 text-sm text-foreground/75">
            Tour news and seasonal ideas. Unsubscribe any time.
          </p>
          {state === "done" ? (
            <div role="status" className="mt-6 rounded-md bg-brand-100 px-6 py-4 text-foreground font-medium">
              You&apos;re subscribed. Look out for our next update.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                aria-label="Email for travel tips"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-md border border-[#202b2640] bg-white px-5 py-3 text-sm outline-none focus:border-brand-400 sm:w-72"
              />
              <button
                type="submit"
                disabled={state === "loading"}
                className="rounded-md bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {state === "loading" ? "Subscribing…" : "Get travel tips"}
              </button>
            </form>
          )}
          {state === "error" && (
            <p role="alert" className="mt-3 text-xs text-red-700">We couldn’t subscribe you. Please try again.</p>
          )}
        </div>
      </div>
    </section>
  );
}
