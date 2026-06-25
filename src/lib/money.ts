// Money is always integer NZD cents internally.

export function formatNZD(cents: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** Bare dollar string without currency symbol, e.g. "185". */
export function dollars(cents: number): string {
  const v = cents / 100;
  return v % 1 === 0 ? String(v) : v.toFixed(2);
}
