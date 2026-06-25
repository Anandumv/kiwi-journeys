"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function MediaUploader() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    try {
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (res.ok) setLast((await res.json()).url);
      }
      router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-xl border border-ivory-200 bg-white p-5">
      <label className="inline-block cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
        {busy ? "Uploading…" : "Upload images"}
        <input type="file" accept="image/*" multiple className="hidden" onChange={onPick} disabled={busy} />
      </label>
      {last && (
        <div className="mt-3 flex items-center gap-3 text-xs text-foreground/60">
          <div className="relative h-12 w-16 overflow-hidden rounded"><Image src={last} alt="" fill className="object-cover" sizes="64px" /></div>
          <code className="break-all">{last}</code>
        </div>
      )}
    </div>
  );
}
