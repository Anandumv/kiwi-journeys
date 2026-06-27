"use client";

import { useState } from "react";

const TOUR_OPTIONS = [
  "Christchurch City Discovery",
  "Akaroa Scenic Day Tour",
  "Kaikōura Marine Wildlife",
  "Hanmer Springs Thermal Pools",
  "Waipara Valley Wine Tour",
  "Mount Cook Day Tour",
  "Custom / Bespoke Itinerary",
  "Other / Not sure yet",
];

export function PrivateTourForm() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    groupSize: "",
    preferredDates: "",
    message: "",
  });
  const [selectedTours, setSelectedTours] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTour(t: string) {
    setSelectedTours((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  const field =
    "w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedTours.length === 0) {
      setError("Please select at least one tour of interest.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contact/private-tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          groupSize: Number(form.groupSize) || 1,
          tours: selectedTours,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Could not send enquiry. Please try again.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-8 text-center">
        <p className="text-3xl mb-3">✓</p>
        <h3 className="font-serif text-xl font-semibold text-brand-900">Enquiry received!</h3>
        <p className="mt-2 text-sm text-foreground/70">
          Thank you, {form.fullName}. We'll be in touch within one business day with a
          personalised quote.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            className={field}
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="Your full name"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            className={field}
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">
            Phone
          </label>
          <input
            className={field}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+1 555 000 0000"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">
            Group size <span className="text-red-500">*</span>
          </label>
          <input
            className={field}
            type="number"
            min="1"
            max="500"
            required
            value={form.groupSize}
            onChange={(e) => setForm({ ...form, groupSize: e.target.value })}
            placeholder="e.g. 8"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2">
          Tours of interest <span className="text-red-500">*</span>
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {TOUR_OPTIONS.map((t) => (
            <label
              key={t}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-brand-100 bg-brand-50/50 px-4 py-2.5 text-sm transition hover:border-brand-300"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                checked={selectedTours.includes(t)}
                onChange={() => toggleTour(t)}
              />
              {t}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">
          Preferred dates
        </label>
        <input
          className={field}
          value={form.preferredDates}
          onChange={(e) => setForm({ ...form, preferredDates: e.target.value })}
          placeholder="e.g. late October, first week of March — flexible on exact dates"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">
          Tell us more
        </label>
        <textarea
          className={field}
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Any special requirements, interests, or questions — the more you share, the better we can tailor your experience."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "Sending enquiry…" : "Send private tour enquiry"}
      </button>
    </form>
  );
}
