"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateDeparturesButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function run() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/generate-departures", { method: "POST" });
    const data = await res.json();
    setMsg(res.ok ? `Created ${data.total} new departures` : "Failed");
    setBusy(false);
    router.refresh();
  }
  return (
    <div className="flex items-center gap-3">
      <button onClick={run} disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
        {busy ? "Generating…" : "Generate 90-day departures"}
      </button>
      {msg && <span className="text-sm text-foreground/60">{msg}</span>}
    </div>
  );
}

export function RefundButton({ id, disabled }: { id: string; disabled: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function execute() {
    setBusy(true);
    await fetch(`/api/admin/bookings/${id}/refund`, { method: "POST" });
    setBusy(false);
    setConfirming(false);
    router.refresh();
  }

  if (disabled) return <span className="text-xs text-foreground/40">—</span>;

  if (confirming) {
    return (
      <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-2 py-1">
        <span className="text-xs text-red-700">Confirm?</span>
        <button
          onClick={execute}
          disabled={busy}
          className="text-xs font-bold text-red-700 hover:text-red-900 disabled:opacity-50"
        >
          {busy ? "…" : "Yes, refund"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-foreground/50 hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
    >
      Refund
    </button>
  );
}
