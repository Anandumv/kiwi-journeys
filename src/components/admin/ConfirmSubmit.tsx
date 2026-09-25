"use client";
export function ConfirmSubmit({ message, children }: { message: string; children: React.ReactNode }) {
  return <button type="submit" className="text-xs text-red-600 hover:underline" onClick={event => { if (!window.confirm(message)) event.preventDefault(); }}>{children}</button>;
}
