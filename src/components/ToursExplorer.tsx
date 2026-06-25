"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const [destination, setDestination] = useState("all");
  const [duration, setDuration] = useState("all");
  const [type, setType] = useState(params.get("type") ?? "all");
  const [price, setPrice] = useState("all");
  const [count, setCount] = useState(PAGE);

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
        (destination === "all" || t.destination === destination) &&
        (duration === "all" || t.durationLabel === duration) &&
        (type === "all" || t.category === type) &&
        band.test(t.priceFromCents),
    );
  }, [tours, destination, duration, type, price]);

  const visible = filtered.slice(0, count);

  const select =
    "w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-brand-800 focus:border-brand-500 focus:outline-none sm:w-auto";

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
        <select className={select} value={destination} onChange={(e) => { setDestination(e.target.value); setCount(PAGE); }}>
          <option value="all">All destinations</option>
          {allDestinations.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className={select} value={duration} onChange={(e) => { setDuration(e.target.value); setCount(PAGE); }}>
          <option value="all">Any duration</option>
          {allDurations.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className={select} value={type} onChange={(e) => { setType(e.target.value); setCount(PAGE); }}>
          <option value="all">All types</option>
          {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <select className={select} value={price} onChange={(e) => { setPrice(e.target.value); setCount(PAGE); }}>
          {priceBands.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
        </select>
      </div>

      <p className="mt-4 text-sm text-foreground/60">{filtered.length} tour{filtered.length === 1 ? "" : "s"}</p>

      {visible.length === 0 ? (
        <p className="mt-10 text-center text-foreground/60">No tours match your filters. Try widening your search.</p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => <TourCard key={t.slug} tour={t} />)}
        </div>
      )}

      {count < filtered.length && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setCount((c) => c + PAGE)}
            className="rounded-full border border-brand-300 px-8 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
