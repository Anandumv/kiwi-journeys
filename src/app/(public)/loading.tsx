export default function Loading() {
  return (
    <div role="status" className="mx-auto flex min-h-[100svh] max-w-7xl flex-col items-center justify-center gap-4 px-4">
      <div aria-hidden="true" className="h-10 w-10 animate-spin rounded-full border-4 border-[#202b2626] border-t-brand-600" />
      <p className="text-sm text-foreground">Loading your next journey…</p>
    </div>
  );
}
