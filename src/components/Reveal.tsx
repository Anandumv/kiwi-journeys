"use client";

import type { CSSProperties, ReactNode } from "react";

// Visible server HTML; CSS enhances it without depending on hydration.
export function Reveal({
  children,
  delay = 0,
  className = "",
  y = 24,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <div
      className={`reveal ${className}`}
      style={{ "--reveal-y": `${y}px`, animationDelay: `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}
