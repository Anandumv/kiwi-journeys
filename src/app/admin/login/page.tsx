"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (res.ok) router.push(params.get("next") || "/admin");
    else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Login failed");
    }
  }

  const field = "w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none";
  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-3">
      <input className={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      <input className={field} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function AdminLogin() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="font-serif text-3xl font-semibold text-brand-900">Kiwi Journeys Admin</h1>
      <p className="mt-2 text-sm text-foreground/60">Sign in to manage tours, content and bookings.</p>
      <Suspense fallback={null}><LoginForm /></Suspense>
      <p className="mt-4 text-xs text-foreground/45">Seeded from ADMIN_EMAIL / ADMIN_PASSWORD in .env.</p>
    </div>
  );
}
