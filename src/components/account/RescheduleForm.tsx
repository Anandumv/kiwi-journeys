"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type SessionSlot = {
  sessionId: string;
  startsAtUtc: string;
  remaining: number;
};

type DayAvailability = {
  date: string;
  sessions: SessionSlot[];
  remaining: number;
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function RescheduleForm({
  reference,
  tourSlug,
  seats,
}: {
  reference: string;
  tourSlug: string;
  seats: number;
}) {
  const router = useRouter();
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setDays([]);
    setSelectedSessionId(null);
    setError(null);
    fetch(`/api/tours/${tourSlug}/availability?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        const available = (data.days ?? []).filter(
          (d: DayAvailability) => d.remaining >= seats,
        );
        setDays(available);
      })
      .catch(() => setError("Could not load availability."))
      .finally(() => setLoading(false));
  }, [open, year, month, tourSlug, seats]);

  async function confirm() {
    if (!selectedSessionId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/bookings/${reference}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSessionId: selectedSessionId }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Could not reschedule. Please try again.");
      } else {
        setDone(true);
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }
  const canGoPrev =
    year > today.getFullYear() ||
    (year === today.getFullYear() && month > today.getMonth() + 1);

  if (done) {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
        Booking rescheduled! Your confirmation email is on its way.
      </div>
    );
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-brand-600 underline hover:text-brand-800"
        >
          Change date
        </button>
      ) : (
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 space-y-4">
          <p className="text-sm font-medium text-brand-900">Choose a new departure date</p>

          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              disabled={!canGoPrev}
              className="px-2 py-1 text-sm text-brand-600 disabled:opacity-30 hover:underline"
            >
              ← Prev
            </button>
            <span className="text-sm font-semibold text-brand-800">
              {MONTHS[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="px-2 py-1 text-sm text-brand-600 hover:underline">
              Next →
            </button>
          </div>

          {loading && <p className="text-xs text-foreground/50">Loading availability…</p>}

          {!loading && days.length === 0 && !error && (
            <p className="text-xs text-foreground/50">
              No available dates this month with {seats} seat{seats > 1 ? "s" : ""}.
            </p>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {days.map((day) =>
              day.sessions.map((s) => {
                const dt = new Date(s.startsAtUtc);
                const label = dt.toLocaleDateString("en-NZ", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  timeZone: "Pacific/Auckland",
                });
                const time = dt.toLocaleTimeString("en-NZ", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Pacific/Auckland",
                });
                const sel = selectedSessionId === s.sessionId;
                return (
                  <button
                    key={s.sessionId}
                    onClick={() => setSelectedSessionId(s.sessionId)}
                    className={`w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition ${
                      sel
                        ? "border-brand-500 bg-brand-50 font-medium text-brand-700"
                        : "border-brand-100 bg-white hover:border-brand-300"
                    }`}
                  >
                    <span>
                      {label} — {time}
                    </span>
                    <span className="text-xs text-foreground/50">{s.remaining} left</span>
                  </button>
                );
              }),
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={confirm}
              disabled={!selectedSessionId || submitting}
              className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Rescheduling…" : "Confirm new date"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-foreground/50 hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
