"use client";

import { useState } from "react";
import Image from "next/image";

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url as string;
}

/** Single image: hidden input[name] holds the URL; preview + upload + manual URL. */
export function SingleImageField({ name, label, defaultValue = "" }: { name: string; label: string; defaultValue?: string }) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try { setUrl(await uploadFile(f)); } finally { setBusy(false); }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-foreground/80">{label}</label>
      <input type="hidden" name={name} value={url} />
      <div className="mt-2 flex items-center gap-4">
        <div className="relative h-20 w-28 overflow-hidden rounded-lg border border-ivory-200 bg-ivory">
          {url ? <Image src={url} alt="" fill className="object-cover" sizes="112px" /> : <span className="flex h-full items-center justify-center text-xs text-foreground/40">none</span>}
        </div>
        <div className="space-y-2">
          <label className="inline-block cursor-pointer rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50">
            {busy ? "Uploading…" : "Upload image"}
            <input type="file" accept="image/*" className="hidden" onChange={onPick} disabled={busy} />
          </label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="or paste URL" className="block w-72 rounded border border-ivory-200 px-2 py-1 text-xs" />
        </div>
      </div>
    </div>
  );
}

/** Multiple images: hidden input[name] holds newline-joined URLs. First = hero. */
export function MultiImageField({ name, label, defaultValue = [] }: { name: string; label: string; defaultValue?: string[] }) {
  const [urls, setUrls] = useState<string[]>(defaultValue);
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    try {
      const added: string[] = [];
      for (const f of files) added.push(await uploadFile(f));
      setUrls((u) => [...u, ...added]);
    } finally { setBusy(false); }
  }
  const move = (i: number, d: number) => setUrls((u) => {
    const n = [...u]; const j = i + d; if (j < 0 || j >= n.length) return u;
    [n[i], n[j]] = [n[j], n[i]]; return n;
  });
  const remove = (i: number) => setUrls((u) => u.filter((_, k) => k !== i));

  return (
    <div>
      <label className="block text-sm font-medium text-foreground/80">{label} <span className="text-xs text-foreground/45">(first image is the hero)</span></label>
      <input type="hidden" name={name} value={urls.join("\n")} />
      <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {urls.map((u, i) => (
          <div key={u + i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-ivory-200">
            <Image src={u} alt="" fill className="object-cover" sizes="160px" />
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Hero</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 px-1 py-0.5 opacity-0 transition group-hover:opacity-100">
              <button type="button" onClick={() => move(i, -1)} className="text-xs text-white">←</button>
              <button type="button" onClick={() => remove(i)} className="text-xs text-white">✕</button>
              <button type="button" onClick={() => move(i, 1)} className="text-xs text-white">→</button>
            </div>
          </div>
        ))}
      </div>
      <label className="mt-3 inline-block cursor-pointer rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50">
        {busy ? "Uploading…" : "Upload image(s)"}
        <input type="file" accept="image/*" multiple className="hidden" onChange={onPick} disabled={busy} />
      </label>
    </div>
  );
}
