"use client";
export function MediaUrl({ url }: { url: string }) {
  return <input aria-label="Image URL" readOnly value={url} className="w-full truncate border-t border-ivory-200 px-2 py-1 text-[10px] text-foreground/70" onFocus={event => event.currentTarget.select()} />;
}
