import { z } from 'zod';

const text = z.string();
const link = z.string().refine(v => /^\/(?!\/)/.test(v) || /^https?:\/\//i.test(v), 'Use a site path or an http(s) URL');
const schemas = {
  nav: z.array(z.object({ label: text.min(1), href: link })),
  stats: z.array(z.object({ value: text, label: text })),
  valueProps: z.array(z.object({ title: text, body: text })),
  social: z.record(text, z.string().url().refine(v => /^https?:\/\//i.test(v))),
  currencyRates: z.record(text, z.number().positive().finite()),
};
export function parseSettingsJson(fd: FormData) {
  const result = {} as { [K in keyof typeof schemas]: z.infer<(typeof schemas)[K]> };
  for (const key of Object.keys(schemas) as (keyof typeof schemas)[]) {
    let value: unknown;
    try { value = JSON.parse(String(fd.get(key) ?? '')); }
    catch { throw new Error(`${key}: enter valid JSON. No settings were saved.`); }
    const parsed = schemas[key].safeParse(value);
    if (!parsed.success) throw new Error(`${key}: ${parsed.error.issues[0].message}. No settings were saved.`);
    Object.assign(result, { [key]: parsed.data });
  }
  return result;
}
export function parseTourPrices(value: string) {
  const rows = value.split('\n').map(v => v.trim()).filter(Boolean).map((line, sortOrder) => {
    const [key, label, dollars, seats] = line.split('|').map(v => v.trim());
    const price = Number(dollars), count = Number(seats || '1');
    if (!key || !label || !dollars || !Number.isFinite(price) || price < 0 || !Number.isSafeInteger(Math.round(price * 100)) || !Number.isInteger(count) || count < 1)
      throw new Error(`Price row ${sortOrder + 1}: provide a key, label, non-negative price and positive whole seat count.`);
    return { key, label, priceCents: Math.round(price * 100), seatsPerUnit: count, sortOrder };
  });
  if (!rows.length) throw new Error('Add at least one price option.');
  if (new Set(rows.map(v => v.key)).size !== rows.length) throw new Error('Price option keys must be unique.');
  return rows;
}
