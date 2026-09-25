"use client";

import Image from "next/image";
import { useState } from "react";

// Fills its parent: the tour hero gives it a fixed-height media column.
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return null;

  return (
    <div className="relative h-full min-h-[320px] min-w-0 sm:min-h-[460px] lg:min-h-[640px]">
      <Image src={images[active]} alt={`${title} — photo ${active + 1} of ${images.length}`} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 60vw" />
      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/45 to-transparent px-4 pb-3 pt-12 sm:px-6 sm:pb-5">
          <div className="flex gap-2 overflow-x-auto">
            {images.map((src, i) => (
              <button
                key={src}
                onClick={() => setActive(i)}
                className={`relative h-12 w-16 flex-shrink-0 overflow-hidden outline outline-2 outline-offset-2 transition max-sm:h-9 max-sm:w-12 sm:h-14 sm:w-20 ${i === active ? "outline-white" : "outline-transparent opacity-75 hover:opacity-100"}`}
                aria-label={`View photo ${i + 1}`}
                aria-pressed={i === active}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
          <span className="hidden shrink-0 text-xs font-semibold uppercase tracking-[.13em] text-white sm:block" aria-hidden="true">
            {String(active + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
}
