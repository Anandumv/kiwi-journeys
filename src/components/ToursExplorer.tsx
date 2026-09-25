"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { categories, type Tour } from "@/data/tours";
import { TourCard } from "@/components/TourCard";

const PAGE = 6;

const priceBands = [
  { key: "all", label: "All prices", test: () => true },
  { key: "u200", label: "Under $200", test: (c: number) => c < 20000 },
  { key: "200-350", label: "$200–$350", test: (c: number) => c >= 20000 && c <= 35000 },
  { key: "350p", label: "$350+", test: (c: number) => c > 35000 },
];

export function ToursExplorer({ tours }: { tours: Tour[] }) {
  const params = useSearchParams();
  const pathname = usePathname();
  // Every filter is seeded from the URL, not just type and q, so a shared or
  // bookmarked link restores the exact result set the sender was looking at.
  const destination = params.get("destination") ?? "all";
  const duration = params.get("duration") ?? "all";
  const type = params.get("type") ?? "all";
  const query = params.get("q") ?? "";
  const price = priceBands.some(b => b.key === params.get("price")) ? params.get("price")! : "all";
  const [count, setCount] = useState(PAGE);

  // Mirror the filters back into the URL. Filtering used to be invisible to the
  // address bar, so a filtered list could not be shared, bookmarked or returned
  // to with the back button. replace(), not push(), so typing in the search box
  // does not bury the previous page under one history entry per keystroke.
  useEffect(() => { setCount(PAGE); }, [params]);
  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(window.location.search);
    if (!value || value === "all") next.delete(key); else next.set(key, value);
    const qs = next.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    setCount(PAGE);
  }
  const setDestination = (value: string) => setFilter("destination", value);
  const setDuration = (value: string) => setFilter("duration", value);
  const setType = (value: string) => setFilter("type", value);
  const setQuery = (value: string) => setFilter("q", value);
  const setPrice = (value: string) => setFilter("price", value);

  const allDestinations = useMemo(
    () => Array.from(new Set(tours.map((t) => t.destination))).sort(),
    [tours],
  );
  const allDurations = useMemo(
    () => Array.from(new Set(tours.map((t) => t.durationLabel))).sort(),
    [tours],
  );

  const filtered = useMemo(() => {
    const band = priceBands.find((b) => b.key === price)!;
    return tours.filter(
      (t) =>
        (!query.trim() || `${t.title} ${t.destination} ${t.summary}`.toLowerCase().includes(query.trim().toLowerCase())) &&
        (destination === "all" || t.destination === destination) &&
        (duration === "all" || t.durationLabel === duration) &&
        (type === "all" || t.category === type) &&
        band.test(t.priceFromCents),
    );
  }, [tours, destination, duration, type, price, query]);

  const visible = filtered.slice(0, count);

  const select =
    "min-h-11 w-full border border-[#202b2640] bg-[#f8f8f3] px-3 py-2.5 text-sm text-foreground hover:border-foreground sm:w-auto";

  return (
    <div>
      <label htmlFor="tour-search" className="mb-3 block text-[11px] font-semibold uppercase tracking-[.13em] text-foreground/65">Find your day out</label>
      <input id="tour-search" type="search" value={query} onChange={e => { setQuery(e.target.value); setCount(PAGE); }} placeholder="Search tours or destinations" className="mb-5 w-full border-0 border-b-2 border-foreground bg-transparent px-0 pb-3 pt-1 text-2xl tracking-[-.02em] placeholder:text-foreground/40 focus:outline-none focus-visible:border-brand-600 sm:text-3xl" />
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
        <select aria-label="Destination" className={select} value={destination} onChange={(e) => { setDestination(e.target.value); setCount(PAGE); }}>
          <option value="all">All destinations</option>
          {allDestinations.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select aria-label="Duration" className={select} value={duration} onChange={(e) => { setDuration(e.target.value); setCount(PAGE); }}>
          <option value="all">Any duration</option>
          {allDurations.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select aria-label="Experience type" className={select} value={type} onChange={(e) => { setType(e.target.value); setCount(PAGE); }}>
          <option value="all">All types</option>
          {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <select aria-label="Price range" className={select} value={price} onChange={(e) => { setPrice(e.target.value); setCount(PAGE); }}>
          {priceBands.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
        </select>
      </div>

      <p role="status" className="mt-8 border-b border-[#202b2626] pb-3 text-[11px] font-semibold uppercase tracking-[.13em] text-foreground/65">{filtered.length} tour{filtered.length === 1 ? "" : "s"}</p>

      {visible.length === 0 ? (
        <div className="mt-10 border-y border-[#202b2626] py-12 text-center">
          <p className="font-medium text-brand-900">No tours match your filters.</p>
          <p className="mt-2 text-sm text-foreground/70">Try another destination or clear your filters to see all tours.</p>
          <button onClick={() => window.history.replaceState(null, "", pathname)} className="mt-5 bg-[#203c33] px-5 py-3 text-sm font-semibold text-white hover:bg-[#315445]">Clear filters</button>
        </div>
      ) : (
        <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => <TourCard key={t.slug} tour={t} />)}
        </div>
      )}

      {count < filtered.length && (
        <div className="mt-14 text-center">
          <button
            onClick={() => setCount((c) => c + PAGE)}
            className="min-h-12 border border-foreground px-8 py-3 text-sm font-semibold text-foreground transition hover:bg-foreground hover:text-[#f8f8f3]"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
