// Short task pages (sign-in, lookup, confirmations, 404) share a split layout
// so a small form never floats alone above the footer.
export function TaskShell({ eyebrow, title, intro, children }: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#202b2626] bg-[#e8e6dc] md:bg-[linear-gradient(to_right,#e8e6dc_50%,#f8f8f3_50%)]">
      <div className="mx-auto grid min-h-[min(78vh,760px)] max-w-6xl md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col justify-between gap-10 px-5 py-10 sm:px-8 md:border-r md:border-[#202b2626] md:py-14">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.13em] text-foreground/75 before:h-px before:w-8 before:bg-current">{eyebrow}</p>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(56px,7vw,112px)] font-medium leading-[.86] tracking-[-.03em] text-foreground">{title}</h1>
            {intro && <div className="mt-6 max-w-md leading-relaxed text-foreground/80">{intro}</div>}
          </div>
          <p className="text-[11px] uppercase tracking-[.13em] text-foreground/70">Kiwi Globe Tours · Christchurch</p>
        </div>
        {children && <div className="flex flex-col justify-center bg-[#f8f8f3] px-5 py-10 sm:px-8 md:px-12 md:py-14">{children}</div>}
      </div>
    </section>
  );
}
