import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow text-sand-600">404</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-brand-900">This page wandered off the trail</h1>
      <p className="mt-3 text-foreground/65">We couldn&apos;t find what you were looking for. Let&apos;s get you back on track.</p>
      <div className="mt-7 flex gap-3">
        <Link href="/" className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">Home</Link>
        <Link href="/tours" className="rounded-full border border-brand-300 px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">Browse tours</Link>
      </div>
    </div>
  );
}
