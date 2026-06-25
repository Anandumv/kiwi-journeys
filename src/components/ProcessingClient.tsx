"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function ProcessingClient() {
  const params = useSearchParams();
  const router = useRouter();
  const reservationId = params.get("reservation");
  const [slow, setSlow] = useState(false);

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
      if (tries > 20) clearInterval(id);
    }, 1500);
    return () => clearInterval(id);
  }, [reservationId, router]);

  return (
    <>
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      <h1 className="mt-6 text-xl font-bold text-brand-900">Confirming your booking…</h1>
      <p className="mt-2 text-sm text-foreground/70">Please don&apos;t close this window — payment received, finalising your reservation.</p>
      {slow && (
        <p className="mt-6 text-sm text-foreground/60">
          This is taking longer than usual. Your payment was successful and we&apos;ll email your
          confirmation shortly. <Link href="/" className="font-semibold text-brand-600 hover:underline">Return home</Link>
        </p>
      )}
    </>
  );
}
