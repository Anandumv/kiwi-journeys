// Reusable trust badge strip — place near CTAs and in booking sidebar.
export function TrustBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs font-medium text-foreground/60 ${className}`}>
      <Badge icon="🔒" text="Secure checkout" />
      <Badge icon="✓" text="Free cancellation" />
      <Badge icon="🏅" text="Locally owned" />
      <Badge icon="👥" text="Small groups" />
    </div>
  );
}

export function PaymentBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/40">Secure payment</p>
      <div className="flex flex-wrap gap-2">
        {["VISA", "MC", "AMEX", "STRIPE"].map((brand) => (
          <span
            key={brand}
            className="rounded border border-ivory-200 bg-white px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-foreground/50"
          >
            {brand}
          </span>
        ))}
        <span className="flex items-center gap-1 rounded border border-ivory-200 bg-white px-2 py-1 text-[10px] font-semibold text-foreground/50">
          🔒 256-bit SSL
        </span>
      </div>
    </div>
  );
}

function Badge({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span>{icon}</span>
      <span>{text}</span>
    </span>
  );
}
