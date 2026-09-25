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
    <div className="mt-4 border-b border-[#202b2626] py-3">
      <div className="flex items-center justify-between">
        <label htmlFor="price-currency" className="text-xs font-medium text-foreground/75">Show price in</label>
        <select
          id="price-currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="min-h-9 border border-[#202b2640] bg-white px-2 py-1 text-xs text-foreground"
        >
          {codes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {currency !== "NZD" && (
        <p className="mt-2 text-sm text-foreground/75">
          ≈ <span className="font-semibold text-brand-700">{new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value)}</span>{" "}
          <span className="text-xs text-foreground/75">/ person (approx — charged in NZD)</span>
        </p>
      )}
    </div>
  );
}
