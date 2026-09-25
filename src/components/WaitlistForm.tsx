"use client";

import { useState } from "react";

type Props = {
  tourId: string;
  sessionId?: string;
  /** Shown so the customer knows which departure they are queueing for. */
  dateLabel?: string;
  defaultSeats?: number;
};

/**
 * Join-the-waitlist form, shown when a departure has no seats left.
 *
 * The Waitlist model, /api/waitlist, the admin queue and the waitlist-notify
 * cron all existed before this component, but nothing on the public site ever
 * called them — a sold-out departure simply turned the customer away. This is
 * the missing front door.
 */
export function WaitlistForm({ tourId, sessionId, dateLabel, defaultSeats = 1 }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [seats, setSeats] = useState(defaultSeats);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourId, sessionId, fullName, email, phone, seats }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          res.status === 429
            ? "You've already joined a few waitlists. Please try again later."
            : data.error || "Could not join the waitlist. Please try again.",
        );
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("Network error. Please try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div role="status" className="mt-4 rounded-lg border border-[#202b2640] bg-[#eeede6] px-4 py-3">
        <p className="text-sm font-semibold text-foreground">You&rsquo;re on the waitlist.</p>
        <p className="mt-1 text-sm text-foreground/75">
          We&rsquo;ll email {email} if a seat opens up{dateLabel ? ` on ${dateLabel}` : ""}. Joining the
          waitlist doesn&rsquo;t charge you or hold a seat.
        </p>
      </div>
    );
  }

  const field = "w-full rounded-lg border border-[#202b2640] bg-white px-3 py-2 text-sm";

  return (
    <form onSubmit={onSubmit} className="mt-4 rounded-lg border border-[#202b2640] bg-[#eeede6]/60 p-4">
      <p className="text-sm font-semibold text-foreground">
        Sold out{dateLabel ? ` on ${dateLabel}` : ""} — join the waitlist
      </p>
      <p className="mt-1 text-sm text-foreground/75">
        We&rsquo;ll email you if a seat frees up. No payment, and no seat is held.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="wl-name" className="mb-1 block text-xs font-medium text-foreground/75">Full name</label>
          <input id="wl-name" required maxLength={200} value={fullName}
            onChange={(e) => setFullName(e.target.value)} className={field} autoComplete="name" />
        </div>
        <div>
          <label htmlFor="wl-email" className="mb-1 block text-xs font-medium text-foreground/75">Email</label>
          <input id="wl-email" required type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={field} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="wl-phone" className="mb-1 block text-xs font-medium text-foreground/75">Phone (optional)</label>
          <input id="wl-phone" maxLength={50} value={phone}
            onChange={(e) => setPhone(e.target.value)} className={field} autoComplete="tel" />
        </div>
        <div>
          <label htmlFor="wl-seats" className="mb-1 block text-xs font-medium text-foreground/75">Seats wanted</label>
          <input id="wl-seats" type="number" min={1} max={20} value={seats}
            onChange={(e) => setSeats(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} className={field} />
        </div>
      </div>

      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}

      <button type="submit" disabled={state === "sending"}
        className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60">
        {state === "sending" ? "Joining…" : "Join the waitlist"}
      </button>
    </form>
  );
}
