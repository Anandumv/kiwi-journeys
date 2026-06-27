"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function SurveyPage() {
  const { ref } = useParams<{ ref: string }>();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [wouldReturn, setWouldReturn] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { setError("Please select a star rating."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/survey/${ref}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, wouldReturn: wouldReturn ?? true, feedback }),
      });
      const d = await res.json();
      if (!res.ok) setError(d.error || "Could not submit. Please try again.");
      else setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <div className="text-5xl">{rating >= 5 ? "🌟" : "🙏"}</div>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-brand-900">Thank you!</h1>
        <p className="mt-3 text-sm text-foreground/60">
          {rating >= 5
            ? "We're thrilled you had a great time! We'll send you a link to share your experience online."
            : "Your feedback helps us improve. We truly appreciate you taking the time."}
        </p>
        <Link href="/tours" className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Browse more tours →
        </Link>
      </div>
    );
  }

  const display = hovered || rating;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-brand-900">How was your tour?</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Your feedback takes less than a minute and helps us and other travellers.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        {/* Star rating */}
        <div>
          <p className="mb-3 text-sm font-medium text-brand-800">Overall rating</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                className={`text-4xl transition-transform hover:scale-110 ${
                  n <= display ? "text-gold-500" : "text-ivory-300"
                }`}
                aria-label={`${n} star${n !== 1 ? "s" : ""}`}
              >
                ★
              </button>
            ))}
          </div>
          {display > 0 && (
            <p className="mt-2 text-sm text-foreground/50">
              {["", "Poor", "Fair", "Good", "Great", "Excellent!"][display]}
            </p>
          )}
        </div>

        {/* Would return */}
        <div>
          <p className="mb-3 text-sm font-medium text-brand-800">Would you book with us again?</p>
          <div className="flex gap-3">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setWouldReturn(v)}
                className={`rounded-full border px-5 py-2 text-sm font-medium transition ${
                  wouldReturn === v
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-brand-200 text-foreground/70 hover:border-brand-400"
                }`}
              >
                {v ? "Yes, definitely!" : "Probably not"}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-800">
            Tell us more <span className="font-normal text-foreground/40">(optional)</span>
          </label>
          <textarea
            className="w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            rows={4}
            placeholder="What was the highlight of your day? Any suggestions for improvement?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !rating}
          className="w-full rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit feedback"}
        </button>
      </form>
    </div>
  );
}
