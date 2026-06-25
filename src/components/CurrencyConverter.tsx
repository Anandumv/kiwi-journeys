"use client";

import { useState } from "react";

// Display-only approximate currency conversion. Charges are always in NZD.
// Rates come from site settings (editable in admin).
export function CurrencyConverter({
  priceFromCents,
  rates,
}: {
  priceFromCents: number;
  rates: Record<string, number>;
}) {
  const codes = Object.keys(rates).length ? Object.keys(rates) : ["NZD"];
  const [currency, setCurrency] = useState("NZD");
  const value = (priceFromCents / 100) * (rates[currency] ?? 1);
  return (
    <div className="mt-4 rounded-xl bg-brand-50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground/60">Show price in</span>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="rounded-md border border-brand-200 bg-white px-2 py-1 text-xs text-brand-800 focus:outline-none"
        >
          {codes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {currency !== "NZD" && (
        <p className="mt-2 text-sm text-foreground/70">
          ≈ <span className="font-semibold text-brand-700">{new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value)}</span>{" "}
          <span className="text-xs text-foreground/50">/ person (approx — charged in NZD)</span>
        </p>
      )}
    </div>
  );
}
