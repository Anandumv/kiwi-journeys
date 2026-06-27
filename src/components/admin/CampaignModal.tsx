"use client";

import { useState } from "react";

interface Props {
  consentCount: number;
  filters: { q?: string; consent?: string };
}

export function CampaignModal({ consentCount, filters }: Props) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setResult(null);
    setError(null);
  }

  async function send() {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, filters }),
      });
      const d = await res.json();
      if (!res.ok) setError(d.error || "Failed to send campaign.");
      else setResult(d);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        disabled={consentCount === 0}
        title={consentCount === 0 ? "No customers with marketing consent in current filter" : undefined}
      >
        Send Campaign ({consentCount})
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-brand-900">Send Campaign Email</h2>
              <button onClick={close} className="text-xl text-foreground/40 hover:text-foreground">✕</button>
            </div>
            <p className="mt-1 text-sm text-foreground/60">
              Sends to up to {consentCount} customers with marketing consent
              {filters.q ? ` matching "${filters.q}"` : ""}.
              Use <code className="rounded bg-ivory px-1 text-xs">{"{name}"}</code> for first name personalisation.
            </p>

            {result ? (
              <div className="mt-6 rounded-xl bg-brand-50 p-5 text-center">
                <div className="text-3xl">✓</div>
                <p className="mt-2 font-semibold text-brand-800">Campaign sent!</p>
                <p className="mt-1 text-sm text-foreground/60">
                  {result.sent} sent · {result.skipped} skipped
                </p>
                <button
                  onClick={close}
                  className="mt-4 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <label className="block text-sm">
                  Subject
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ivory-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    placeholder="Your exclusive offer…"
                  />
                </label>
                <label className="block text-sm">
                  Message
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={8}
                    className="mt-1 w-full rounded-lg border border-ivory-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    placeholder={"Hi {name},\n\nWe have something special for you…"}
                  />
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={send}
                    disabled={sending || !subject.trim() || !body.trim()}
                    className="rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {sending ? "Sending…" : `Send to ${consentCount}`}
                  </button>
                  <button
                    onClick={close}
                    className="rounded-full border border-ivory-200 px-5 py-2 text-sm hover:bg-ivory"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
