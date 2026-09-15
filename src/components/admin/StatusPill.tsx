export function StatusPill({ status }: { status: string }) {
  const cls = status === "CONFIRMED" ? "bg-brand-100 text-brand-700" : status === "REFUNDED" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}
