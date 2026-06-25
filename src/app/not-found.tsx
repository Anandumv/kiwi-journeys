import Link from "next/link";

// Root fallback for unmatched URLs (renders inside the minimal root layout).
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-4 text-center text-foreground">
      <p className="eyebrow text-sand-600">404</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-brand-900">This page wandered off the trail</h1>
      <p className="mt-3 text-foreground/65">We couldn&apos;t find that page.</p>
      <div className="mt-7 flex gap-3">
        <Link href="/" className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">Home</Link>
        <Link href="/tours" className="rounded-full border border-brand-300 px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">Browse tours</Link>
      </div>
    </div>
  );
}
