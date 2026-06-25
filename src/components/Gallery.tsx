"use client";

import Image from "next/image";
import { useState } from "react";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return null;

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-brand-50">
        <Image src={images[active]} alt={`${title} — photo ${active + 1}`} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 60vw" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg ring-2 transition ${i === active ? "ring-brand-500" : "ring-transparent opacity-70 hover:opacity-100"}`}
              aria-label={`View photo ${i + 1}`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
