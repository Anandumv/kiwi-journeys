"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PriceOption = { id: string; key: string; label: string; priceCents: number; seatsPerUnit: number };
type SessionAvail = { sessionId: string; startsAtUtc: string; remaining: number; capacity: number };
type DayAvail = { date: string; sessions: SessionAvail[]; remaining: number };

const NZ_TZ = "Pacific/Auckland";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function nzd(cents: number) {
  return new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD", minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
}
function timeLabel(iso: string) {
  return new Intl.DateTimeFormat("en-NZ", { timeZone: NZ_TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}
/** Today's Auckland date as YYYY-MM-DD. */
function todayNZ() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: NZ_TZ }).format(new Date());
}

export function BookingWidget({
  slug,
  title,
  priceOptions,
}: {
  slug: string;
  title: string;
  priceOptions: PriceOption[];
}) {
  const router = useRouter();
  const now = useMemo(() => todayNZ(), []);
  const [year, setYear] = useState(() => Number(now.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(now.slice(5, 7))); // 1-12

  const [days, setDays] = useState<Record<string, DayAvail>>({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    try {
      const m = `${year}-${String(month).padStart(2, "0")}`;
      const res = await fetch(`/api/tours/${slug}/availability?month=${m}`);
      const data = await res.json();
      const map: Record<string, DayAvail> = {};
      for (const d of data.days ?? []) map[d.date] = d;
      setDays(map);
    } finally {
      setLoading(false);
    }
  }, [slug, year, month]);

  useEffect(() => {
    fetchMonth();
  }, [fetchMonth]);

  // Build the calendar grid (Mon-first) for the visible month.
  const grid = useMemo(() => {
    const first = new Date(Date.UTC(year, month - 1, 1));
    const startWeekday = (first.getUTCDay() + 6) % 7; // 0=Mon
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    return cells;
  }, [year, month]);

  function changeMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setYear(y);
    setMonth(m);
    setSelectedDate(null);
    setSelectedSession(null);
  }

  const daySessions = selectedDate ? days[selectedDate]?.sessions ?? [] : [];
  const activeSession = daySessions.find((s) => s.sessionId === selectedSession) ?? null;

  const seatsRequested = priceOptions.reduce((n, po) => n + (qty[po.id] ?? 0) * po.seatsPerUnit, 0);
  const totalCents = priceOptions.reduce((n, po) => n + (qty[po.id] ?? 0) * po.priceCents, 0);
  const overCapacity = activeSession ? seatsRequested > activeSession.remaining : false;
  const canContinue = !!activeSession && seatsRequested > 0 && !overCapacity && !submitting;

  function setQuantity(id: string, delta: number) {
    setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) + delta) }));
  }

  async function onContinue() {
    if (!activeSession) return;
    setSubmitting(true);
    setError(null);
    try {
      const items = priceOptions
        .map((po) => ({ priceOptionId: po.id, qty: qty[po.id] ?? 0 }))
        .filter((i) => i.qty > 0);
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSession.sessionId, items }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "SOLD_OUT") {
          setError(`Sorry, only ${data.available} seat(s) left on this departure. Please adjust your selection.`);
          await fetchMonth();
        } else {
          setError(data.error || "Could not reserve seats. Please try again.");
        }
        return;
      }
      router.push(`/checkout/${data.reservationId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const monthIsPast = `${year}-${String(month).padStart(2, "0")}` < now.slice(0, 7);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      {/* Calendar */}
      <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <button onClick={() => changeMonth(-1)} disabled={monthIsPast} className="rounded-lg p-2 text-brand-700 hover:bg-brand-50 disabled:opacity-30" aria-label="Previous month">‹</button>
          <h3 className="text-lg font-semibold text-brand-900">{MONTHS[month - 1]} {year}</h3>
          <button onClick={() => changeMonth(1)} className="rounded-lg p-2 text-brand-700 hover:bg-brand-50" aria-label="Next month">›</button>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-foreground/50">
          {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {grid.map((date, i) => {
            if (!date) return <div key={i} />;
            const day = days[date];
            const isPast = date < now;
            const hasAvail = !!day && day.remaining > 0 && !isPast;
            const isSelected = date === selectedDate;
            return (
              <button
                key={date}
                disabled={!hasAvail}
                onClick={() => { setSelectedDate(date); setSelectedSession(null); }}
                className={[
                  "aspect-square rounded-lg text-sm transition",
                  isSelected ? "bg-brand-600 text-white font-semibold" : "",
                  !isSelected && hasAvail ? "bg-brand-50 text-brand-800 hover:bg-brand-100 font-medium" : "",
                  !hasAvail ? "text-foreground/25 cursor-not-allowed" : "",
                ].join(" ")}
                title={hasAvail ? `${day.remaining} seats available` : "Unavailable"}
              >
                {Number(date.slice(8, 10))}
              </button>
            );
          })}
        </div>
        {loading && <p className="mt-3 text-center text-xs text-foreground/50">Loading availability…</p>}
        <div className="mt-4 flex items-center gap-4 text-xs text-foreground/55">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-brand-50 border border-brand-100" /> Available</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-brand-600" /> Selected</span>
        </div>
      </div>

      {/* Selection */}
      <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-brand-900">{title}</h3>

        {!selectedDate && <p className="mt-4 text-sm text-foreground/60">Select an available date to see departure times.</p>}

        {selectedDate && (
          <>
            <p className="mt-3 text-sm font-medium text-foreground/70">Departure time</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {daySessions.map((s) => {
                const soldout = s.remaining <= 0;
                return (
                  <button
                    key={s.sessionId}
                    disabled={soldout}
                    onClick={() => setSelectedSession(s.sessionId)}
                    className={[
                      "rounded-lg border px-3 py-2 text-sm transition",
                      s.sessionId === selectedSession ? "border-brand-600 bg-brand-600 text-white" : "border-brand-200 hover:border-brand-400",
                      soldout ? "opacity-40 line-through cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {timeLabel(s.startsAtUtc)}
                    <span className="ml-1 text-xs opacity-75">{soldout ? "Sold out" : s.remaining <= 3 ? `Only ${s.remaining} left!` : `${s.remaining} left`}</span>
                  </button>
                );
              })}
            </div>

            {activeSession && (
              <>
                {activeSession.remaining <= 4 && (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                    Only {activeSession.remaining} spot{activeSession.remaining !== 1 ? "s" : ""} left on this departure!
                  </p>
                )}
                <p className="mt-5 text-sm font-medium text-foreground/70">Guests</p>
                <div className="mt-2 space-y-2">
                  {priceOptions.map((po) => (
                    <div key={po.id} className="flex items-center justify-between rounded-lg border border-brand-50 px-3 py-2">
                      <div>
                        <div className="text-sm font-medium text-brand-800">{po.label}</div>
                        <div className="text-xs text-foreground/55">{nzd(po.priceCents)}{po.seatsPerUnit > 1 ? ` · ${po.seatsPerUnit} seats` : ""}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setQuantity(po.id, -1)} className="h-10 w-10 rounded-full border border-brand-200 text-lg text-brand-700 hover:bg-brand-50" aria-label={`Decrease ${po.label}`}>−</button>
                        <span className="w-6 text-center text-sm font-semibold">{qty[po.id] ?? 0}</span>
                        <button onClick={() => setQuantity(po.id, 1)} className="h-10 w-10 rounded-full border border-brand-200 text-lg text-brand-700 hover:bg-brand-50" aria-label={`Increase ${po.label}`}>+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-brand-50 pt-4">
                  <span className="text-sm text-foreground/60">Total</span>
                  <span className="text-xl font-bold text-brand-700">{nzd(totalCents)}</span>
                </div>
                {overCapacity && <p className="mt-2 text-sm text-red-600">Only {activeSession.remaining} seats left on this departure.</p>}
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

                <button
                  onClick={onContinue}
                  disabled={!canContinue}
                  className="mt-4 w-full rounded-full bg-sand-500 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-sand-700 disabled:opacity-50"
                >
                  {submitting ? "Reserving…" : "Continue to payment"}
                </button>
                <p className="mt-2 text-center text-xs text-foreground/50">Seats are held for a few minutes while you pay.</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
