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

// ── GST (New Zealand) ────────────────────────────────────────────────────────
// NZ consumer prices must be advertised GST-inclusive, and every price stored
// in this system already is. So GST is never *added* at checkout — it is a
// component of a total the customer has already been quoted. Extracting it from
// a 15% inclusive price is total x 3/23, not total x 0.15.

export const GST_RATE = 0.15;

/** GST already contained in a GST-inclusive total, rounded to whole cents. */
export function gstComponentCents(inclusiveTotalCents: number): number {
  return Math.round(inclusiveTotalCents * 3 / 23);
}

/** The pre-GST (exclusive) portion of a GST-inclusive total. */
export function exGstCents(inclusiveTotalCents: number): number {
  return inclusiveTotalCents - gstComponentCents(inclusiveTotalCents);
}

/**
 * Tax lines for a receipt, or null when the business is not GST registered.
 * A GST number is required on taxable supply information, so without one we
 * must not present a total as a tax invoice.
 */
export function gstSummary(inclusiveTotalCents: number): { number: string; gstCents: number; exGstCents: number } | null {
  const number = process.env.GST_NUMBER;
  if (!number) return null;
  return { number, gstCents: gstComponentCents(inclusiveTotalCents), exGstCents: exGstCents(inclusiveTotalCents) };
}
