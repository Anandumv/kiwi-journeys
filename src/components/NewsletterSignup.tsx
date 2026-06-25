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
    <section className="border-y border-ivory-200 bg-brand-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-brand-500">Stay in the loop</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-900">
            South Island travel tips, straight to your inbox
          </h2>
          <p className="mt-2 text-sm text-foreground/60">
            New tours, seasonal picks, and insider guides — no spam, unsubscribe any time.
          </p>
          {state === "done" ? (
            <div className="mt-6 rounded-xl bg-brand-100 px-6 py-4 text-brand-800 font-medium">
              ✓ You&apos;re on the list — look out for South Island inspiration soon.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-full border border-brand-200 bg-white px-5 py-3 text-sm outline-none focus:border-brand-400 sm:w-72"
              />
              <button
                type="submit"
                disabled={state === "loading"}
                className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {state === "loading" ? "Subscribing…" : "Get travel tips"}
              </button>
            </form>
          )}
          {state === "error" && (
            <p className="mt-3 text-xs text-red-500">Something went wrong — please try again.</p>
          )}
        </div>
      </div>
    </section>
  );
}
