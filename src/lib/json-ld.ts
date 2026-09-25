/** Keep CMS text from closing its JSON-LD script element. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/** Structured data needs absolute URLs; CMS images are usually site-relative. */
export function absoluteUrl(siteUrl: string, path?: string | null): string | undefined {
  if (!path) return undefined;
  return /^https?:\/\//.test(path) ? path : `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}
