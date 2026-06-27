"use client";

import { useState } from "react";

export function UpdateNotesForm({
  reference,
  initialNotes,
  canEdit,
}: {
  reference: string;
  initialNotes: string;
  canEdit: boolean;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/account/bookings/${reference}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const d = await res.json();
      if (!res.ok) setError(d.error || "Could not save notes.");
      else setSaved(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-brand-800">
        Pickup hotel / special notes
        {!canEdit && <span className="ml-2 text-xs font-normal text-foreground/40">(locked — within 48h of departure)</span>}
      </label>
      <textarea
        className="mt-2 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none disabled:bg-ivory"
        rows={3}
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
        disabled={!canEdit || saving}
        placeholder="e.g. Staying at Commodore Hotel, vegan meal required"
      />
      {canEdit && (
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save notes"}
          </button>
          {saved && <span className="text-sm text-teal-700">Saved!</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      )}
    </div>
  );
}

export function CancelRequestButton({
  reference,
  hoursUntilDeparture,
}: {
  reference: string;
  hoursUntilDeparture: number;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pct = hoursUntilDeparture > 72 ? "full" : hoursUntilDeparture > 24 ? "50%" : "no";

  async function submit() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/bookings/${reference}/cancel-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const d = await res.json();
      if (!res.ok) setError(d.error || "Could not send request.");
      else setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
        Cancellation request sent. Our team will be in touch shortly.
      </p>
    );
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-foreground/50 underline hover:text-red-600"
        >
          Request cancellation
        </button>
      ) : (
        <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 space-y-3">
          <p className="text-sm font-medium text-brand-900">Request cancellation</p>
          <p className="text-xs text-foreground/60">
            Refund policy: <strong>{pct} refund</strong> with {hoursUntilDeparture.toFixed(0)}h notice.
            Our team will confirm by email.
          </p>
          <textarea
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:outline-none"
            rows={2}
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={submit}
              disabled={sending}
              className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Confirm request"}
            </button>
            <button onClick={() => setOpen(false)} className="text-sm text-foreground/50 hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
