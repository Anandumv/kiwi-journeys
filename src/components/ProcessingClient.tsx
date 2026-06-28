"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function ProcessingClient() {
  const params = useSearchParams();
  const router = useRouter();
  const reservationId = params.get("reservation");
  const [slow, setSlow] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!reservationId) return;
    let tries = 0;
    const id = setInterval(async () => {
      tries++;
      if (tries > 8) setSlow(true);
      try {
        const res = await fetch(`/api/reservations/${reservationId}/status`);
        const data = await res.json();
        if (data.status === "CONVERTED" && data.reference) {
          clearInterval(id);
          router.replace(`/booking/${data.reference}`);
        }
      } catch {
        /* keep polling */
      }
      if (tries > 20) {
        clearInterval(id);
        setTimedOut(true);
      }
    }, 1500);
    return () => clearInterval(id);
  }, [reservationId, router]);

  if (timedOut) {
    return (
      <>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 className="mt-6 text-xl font-bold text-brand-900">Taking longer than expected</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Your payment was received. We&apos;re still confirming your booking — it should arrive by email shortly.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/booking/lookup"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Find my booking by email
          </Link>
          <Link href="/" className="text-sm text-foreground/60 hover:underline">
            Return home
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      <h1 className="mt-6 text-xl font-bold text-brand-900">Confirming your booking…</h1>
      <p className="mt-2 text-sm text-foreground/70">Please don&apos;t close this window — payment received, finalising your reservation.</p>
      {slow && (
        <p className="mt-6 text-sm text-foreground/60">
          This is taking longer than usual. Your payment was successful and we&apos;ll email your
          confirmation shortly.
        </p>
      )}
    </>
  );
}
