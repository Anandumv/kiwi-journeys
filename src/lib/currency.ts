// Display-only FX. All charges are in NZD; these convert NZD for friendly display.
// Static fallback rates (1 NZD = X). Update via /api/cron/currency-rates if wired
// to a live FX API. Rates are approximate.
export const NZD_RATES: Record<string, number> = {
  NZD: 1,
  AUD: 0.92,
  USD: 0.6,
  GBP: 0.47,
  EUR: 0.56,
  INR: 51.5,
};

export const CURRENCY_LABELS: Record<string, string> = {
  NZD: "NZ$",
  AUD: "A$",
  USD: "US$",
  GBP: "£",
  EUR: "€",
  INR: "₹",
};

export function convertFromNZDCents(cents: number, currency: string): number {
  const rate = NZD_RATES[currency] ?? 1;
  return (cents / 100) * rate;
}

export function formatConverted(cents: number, currency: string): string {
  const value = convertFromNZDCents(cents, currency);
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
