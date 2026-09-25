"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WaitlistForm } from "./WaitlistForm";

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
  tourId = null,
}: {
  slug: string;
  title: string;
  priceOptions: PriceOption[];
  /** Null when rendering without a database; the waitlist is hidden. */
  tourId?: string | null;
}) {
  const router = useRouter();
  const now = useMemo(() => todayNZ(), []);
  const [year, setYear] = useState(() => Number(now.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(now.slice(5, 7))); // 1-12

  const [days, setDays] = useState<Record<string, DayAvail>>({});
  const [loading, setLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchMonth = useCallback(async (signal?: AbortSignal) => {
    const version = ++requestVersion.current;
    setLoading(true);
    setAvailabilityError(null);
    try {
      const m = `${year}-${String(month).padStart(2, "0")}`;
      const res = await fetch(`/api/tours/${slug}/availability?month=${m}`, { signal });
      if (!res.ok) throw new Error("Availability unavailable");
      const data = await res.json();
      if (version !== requestVersion.current || signal?.aborted) return;
      const map: Record<string, DayAvail> = {};
      for (const d of data.days ?? []) map[d.date] = d;
      setDays(map);
    } catch {
      if (version !== requestVersion.current || signal?.aborted) return;
      setDays({});
      setAvailabilityError("We couldn't load departure dates. Please try again.");
    } finally {
      if (version === requestVersion.current && !signal?.aborted) setLoading(false);
    }
  }, [slug, year, month]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchMonth(controller.signal);
    return () => controller.abort();
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
  // Every departure on the chosen day is full. Sold-out time buttons are
  // disabled, so the customer cannot select one to discover this — offer the
  // waitlist for the day instead of letting them leave.
  const dayIsSoldOut = daySessions.length > 0 && daySessions.every((s) => s.remaining <= 0);
  const canContinue = !!activeSession && seatsRequested > 0 && !overCapacity && !submitting && !loading && !availabilityError;

  function setQuantity(id: string, delta: number) {
    setQty((q) => ({ ...q, [id]: Math.min(50, Math.max(0, (q[id] ?? 0) + delta)) }));
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

  const monthIsPast = `${year}-${String(month).padStart(2, "0")}` <= now.slice(0, 7);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
      {/* Calendar */}
      <div className="border border-[#202b2626] bg-white p-5 sm:p-7">
        <p className="mb-5 flex items-baseline gap-3 border-b border-[#202b2626] pb-4 text-[11px] font-semibold uppercase tracking-[.13em] text-foreground/75"><span className="font-[family-name:var(--font-display)] text-2xl tracking-normal text-foreground">01</span>Date</p>
        <div className="flex items-center justify-between">
          <button onClick={() => changeMonth(-1)} disabled={monthIsPast} className="flex h-11 w-11 items-center justify-center border border-[#202b2640] text-lg text-foreground hover:border-foreground disabled:opacity-30" aria-label="Previous month">‹</button>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-medium text-foreground" aria-live="polite">{MONTHS[month - 1]} {year}</h2>
          <button onClick={() => changeMonth(1)} className="flex h-11 w-11 items-center justify-center border border-[#202b2640] text-lg text-foreground hover:border-foreground" aria-label="Next month">›</button>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[.08em] text-foreground/70">
          {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {grid.map((date, i) => {
            if (!date) return <div key={i} />;
            const day = days[date];
            const isPast = date < now;
            const hasDeparture = !!day && day.sessions.length > 0 && !isPast;
            const hasAvail = hasDeparture && day.remaining > 0;
            const canSelect = hasDeparture && (hasAvail || !!tourId);
            const isSelected = date === selectedDate;
            return (
              <button
                key={date}
                disabled={!canSelect || loading}
                aria-label={`${date}${hasAvail ? `, ${day.remaining} seats available` : canSelect ? ", sold out, join waitlist" : ", unavailable"}`}
                aria-pressed={isSelected}
                onClick={() => { setSelectedDate(date); setSelectedSession(null); }}
                className={[
                  "aspect-square text-sm tabular-nums transition",
                  isSelected ? "bg-[#203c33] text-white font-semibold" : "",
                  !isSelected && hasAvail ? "border border-[#203c33] font-semibold text-foreground hover:bg-[#203c33] hover:text-white" : "",
                  !isSelected && canSelect && !hasAvail ? "border border-dashed border-[#202b2680] text-foreground/75 hover:border-foreground" : "",
                  !canSelect ? "text-foreground/35 cursor-not-allowed" : "",
                ].join(" ")}
                title={hasAvail ? `${day.remaining} seats available` : canSelect ? "Sold out — join waitlist" : "Unavailable"}
              >
                {Number(date.slice(8, 10))}
              </button>
            );
          })}
        </div>
        {availabilityError && <div role="alert" className="mt-3 text-sm text-red-700">{availabilityError} <button onClick={() => void fetchMonth()} className="font-semibold underline">Retry</button></div>}
        {!loading && !availabilityError && Object.keys(days).length === 0 && <p className="mt-3 text-sm text-foreground/75">No departures available this month. Try the next month or contact us.</p>}
        {loading && <p className="mt-3 text-center text-xs text-foreground/70">Loading availability…</p>}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#202b2626] pt-4 text-xs text-foreground/75">
          <span className="flex items-center gap-2"><span className="h-3 w-3 border border-[#203c33]" /> Available</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 bg-[#203c33]" /> Selected</span>
          {tourId && <span className="flex items-center gap-2"><span className="h-3 w-3 border border-dashed border-[#202b2680]" /> Sold out · waitlist</span>}
        </div>
      </div>

      {/* Selection */}
      <div className="border border-[#202b2626] bg-white p-5 sm:p-7 lg:sticky lg:top-24 lg:h-fit">
        <p className="flex items-baseline gap-3 border-b border-[#202b2626] pb-4 text-[11px] font-semibold uppercase tracking-[.13em] text-foreground/75"><span className="font-[family-name:var(--font-display)] text-2xl tracking-normal text-foreground">02</span>Time &amp; guests</p>
        <h2 className="mt-4 text-xl font-medium tracking-[-.02em] text-foreground">{title}</h2>

        {!selectedDate && <p className="mt-2 text-sm text-foreground/75">Select a date to see departure times{tourId ? " or join a sold-out departure’s waitlist" : ""}.</p>}

        {selectedDate && (
          <>
            <p className="mt-4 text-sm font-medium text-foreground/75">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-NZ", { weekday: "long", day: "numeric", month: "long" })} · departure time</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {daySessions.map((s) => {
                const soldout = s.remaining <= 0;
                return (
                  <button
                    key={s.sessionId}
                    disabled={soldout && !tourId}
                    aria-pressed={s.sessionId === selectedSession}
                    onClick={() => setSelectedSession(s.sessionId)}
                    className={[
                      "min-h-11 border px-4 py-2 text-sm tabular-nums transition",
                      s.sessionId === selectedSession ? "border-[#203c33] bg-[#203c33] text-white" : "border-[#202b2640] hover:border-foreground",
                      soldout && !tourId ? "opacity-40 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {timeLabel(s.startsAtUtc)}
                    <span className="ml-2 text-xs opacity-80">{soldout ? "Sold out · waitlist" : `${s.remaining} left`}</span>
                  </button>
                );
              })}
            </div>

            {tourId && activeSession && activeSession.remaining <= 0 && (
              <WaitlistForm
                key={activeSession.sessionId}
                tourId={tourId}
                sessionId={activeSession.sessionId}
                dateLabel={`${selectedDate} at ${timeLabel(activeSession.startsAtUtc)}`}
                defaultSeats={Math.max(1, seatsRequested || 1)}
              />
            )}

            {dayIsSoldOut && !activeSession && <p className="mt-3 text-sm text-brand-800">Select a departure time to join its waitlist.</p>}
            {activeSession && activeSession.remaining > 0 && (
              <>
                {activeSession.remaining <= 4 && (
                  <p className="mt-3 border-l-2 border-amber-600 pl-3 text-sm font-medium text-amber-800">
                    {activeSession.remaining} seat{activeSession.remaining !== 1 ? "s" : ""} left on this departure.
                  </p>
                )}
                <p className="mt-6 text-sm font-medium text-foreground/75">Guests</p>
                <div className="mt-2 border-t border-[#202b2626]">
                  {priceOptions.map((po) => (
                    <div key={po.id} className="flex items-center justify-between border-b border-[#202b2626] py-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">{po.label}</div>
                        <div className="text-xs text-foreground/75">{nzd(po.priceCents)}{po.seatsPerUnit > 1 ? ` · ${po.seatsPerUnit} seats` : ""}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setQuantity(po.id, -1)} className="h-11 w-11 border border-[#202b2640] text-lg text-foreground hover:border-foreground" aria-label={`Decrease ${po.label}`}>−</button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">{qty[po.id] ?? 0}</span>
                        <button onClick={() => setQuantity(po.id, 1)} className="h-11 w-11 border border-[#202b2640] text-lg text-foreground hover:border-foreground" aria-label={`Increase ${po.label}`}>+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-baseline justify-between">
                  <span className="text-sm text-foreground/75">Total (NZD)</span>
                  <span className="font-[family-name:var(--font-display)] text-4xl font-medium tabular-nums text-foreground">{nzd(totalCents)}</span>
                </div>
                {overCapacity && <p className="mt-2 text-sm text-red-600">Only {activeSession.remaining} seats left on this departure.</p>}
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

                <button
                  onClick={onContinue}
                  disabled={!canContinue}
                  className="mt-4 flex min-h-[52px] w-full items-center justify-center bg-[#203c33] px-6 font-semibold text-white transition hover:bg-[#315445] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Reserving…" : "Continue to payment"}
                </button>
                <p className="mt-2 text-center text-xs text-foreground/75">Seats are held for a few minutes while you pay.</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
