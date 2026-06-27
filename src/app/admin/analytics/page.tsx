import { prisma } from "@/lib/db";
import { formatNZD } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

export default async function AdminAnalytics({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const now = new Date();

  const rangeEnd = to ? new Date(to + "T23:59:59.999Z") : now;
  const rangeStart = from
    ? new Date(from)
    : new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() - 5, 1);

  const [allBookings, totalCustomers, thisMonthAgg, lastMonthAgg] = await Promise.all([
    prisma.booking.findMany({
      where: { status: "CONFIRMED", createdAt: { gte: rangeStart, lte: rangeEnd } },
      select: { totalCents: true, createdAt: true, sessionId: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.customer.count(),
    prisma.booking.aggregate({
      where: { status: "CONFIRMED", createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.booking.aggregate({
      where: {
        status: "CONFIRMED",
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          lt: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      },
      _sum: { totalCents: true },
      _count: true,
    }),
  ]);

  // Monthly buckets — 6 months ending at rangeEnd, oldest → newest
  const months: { label: string; bookings: number; revCents: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString("en-NZ", { month: "short", year: "2-digit" }),
      bookings: 0,
      revCents: 0,
    });
  }
  for (const b of allBookings) {
    const ago =
      (rangeEnd.getFullYear() - b.createdAt.getFullYear()) * 12 +
      (rangeEnd.getMonth() - b.createdAt.getMonth());
    if (ago >= 0 && ago <= 5) {
      const idx = 5 - ago;
      months[idx].bookings += 1;
      months[idx].revCents += b.totalCents;
    }
  }

  const maxRev = Math.max(...months.map((m) => m.revCents), 1);
  const maxBookings = Math.max(...months.map((m) => m.bookings), 1);
  const totalRev = allBookings.reduce((s, b) => s + b.totalCents, 0);
  const totalBookings = allBookings.length;
  const avgCents = totalBookings ? Math.round(totalRev / totalBookings) : 0;
  const thisRev = thisMonthAgg._sum.totalCents ?? 0;
  const lastRev = lastMonthAgg._sum.totalCents ?? 0;
  const mom = lastRev > 0 ? Math.round(((thisRev - lastRev) / lastRev) * 100) : null;

  // Top tours from session lookup
  const sessionIds = [...new Set(allBookings.map((b) => b.sessionId))];
  const sessions = await prisma.session.findMany({
    where: { id: { in: sessionIds } },
    select: { id: true, tour: { select: { title: true } } },
  });
  const sessionTourMap = new Map(sessions.map((s) => [s.id, s.tour.title]));
  const tourRevMap = new Map<string, { revCents: number; count: number }>();
  for (const b of allBookings) {
    const title = sessionTourMap.get(b.sessionId) ?? "Unknown";
    const existing = tourRevMap.get(title);
    if (existing) {
      existing.revCents += b.totalCents;
      existing.count += 1;
    } else {
      tourRevMap.set(title, { revCents: b.totalCents, count: 1 });
    }
  }
  const topTours = Array.from(tourRevMap.entries())
    .map(([title, d]) => ({ title, ...d }))
    .sort((a, b) => b.revCents - a.revCents)
    .slice(0, 5);

  const rangeLabel = from || to
    ? `${from ?? "all time"} → ${to ?? "today"}`
    : "Last 6 months";

  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl font-semibold text-brand-900">Analytics</h1>
      <p className="mt-1 text-sm text-foreground/50">{rangeLabel} — confirmed bookings only</p>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          From
          <input type="date" name="from" defaultValue={from} className="mt-1 block rounded-lg border border-ivory-200 bg-white px-3 py-2 text-sm" />
        </label>
        <label className="text-sm">
          To
          <input type="date" name="to" defaultValue={to} className="mt-1 block rounded-lg border border-ivory-200 bg-white px-3 py-2 text-sm" />
        </label>
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Apply</button>
        {(from || to) && <a href="/admin/analytics" className="rounded-lg border border-ivory-200 px-4 py-2 text-sm hover:bg-ivory">Reset</a>}
      </form>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Revenue" value={formatNZD(totalRev)} />
        <KpiCard label="Bookings" value={String(totalBookings)} />
        <KpiCard label="Avg booking value" value={formatNZD(avgCents)} />
        <KpiCard label="Total customers" value={String(totalCustomers)} />
      </div>

      {/* Revenue bar chart */}
      <div className="mt-8 rounded-xl border border-ivory-200 bg-white p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-lg font-semibold text-brand-900">Monthly Revenue</h2>
          {mom !== null && (
            <span className={`text-sm font-medium ${mom >= 0 ? "text-green-600" : "text-red-500"}`}>
              {mom >= 0 ? "+" : ""}
              {mom}% vs last month
            </span>
          )}
        </div>
        <div className="mt-6 flex items-end gap-2" style={{ height: 180 }}>
          {months.map((m) => {
            const pct = maxRev > 0 ? Math.max((m.revCents / maxRev) * 100, 2) : 2;
            return (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-1 self-end">
                {m.revCents > 0 && (
                  <span className="whitespace-nowrap text-[10px] text-foreground/50">{formatNZD(m.revCents)}</span>
                )}
                <div
                  className="w-full rounded-t-md bg-brand-400 transition-all"
                  style={{ height: `${pct}%` }}
                />
                <span className="text-xs text-foreground/60">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {/* Bookings horizontal bars */}
        <div className="rounded-xl border border-ivory-200 bg-white p-6">
          <h2 className="font-serif text-lg font-semibold text-brand-900">Monthly Bookings</h2>
          <div className="mt-4 space-y-3">
            {months.map((m) => (
              <div key={m.label} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-right text-xs text-foreground/60">{m.label}</span>
                <div className="flex-1 overflow-hidden rounded bg-ivory">
                  <div
                    className="h-5 rounded bg-brand-300 transition-all"
                    style={{ width: `${Math.max((m.bookings / maxBookings) * 100, m.bookings > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-foreground/70">{m.bookings}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top tours */}
        <div className="rounded-xl border border-ivory-200 bg-white p-6">
          <h2 className="font-serif text-lg font-semibold text-brand-900">Top Tours by Revenue</h2>
          <div className="mt-4 space-y-3">
            {topTours.length === 0 && (
              <p className="text-sm text-foreground/50">No booking data yet.</p>
            )}
            {topTours.map((t) => (
              <div key={t.title} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-foreground/50">
                    {t.count} booking{t.count !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-brand-700">
                  {formatNZD(t.revCents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Promo code usage */}
      <PromoCodeTable />
    </div>
  );
}

async function PromoCodeTable() {
  const codes = await prisma.promoCode.findMany({
    orderBy: { usedCount: "desc" },
    take: 20,
  });
  if (codes.length === 0) return null;
  return (
    <div className="mt-6 rounded-xl border border-ivory-200 bg-white p-6">
      <h2 className="font-serif text-lg font-semibold text-brand-900">Promo Code Usage</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-foreground/60">
            <tr>
              <th className="pb-2 pr-6">Code</th>
              <th className="pb-2 pr-6">Discount</th>
              <th className="pb-2 pr-6">Uses</th>
              <th className="pb-2 pr-6">Max</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-t border-ivory-100">
                <td className="py-2 pr-6 font-mono font-semibold tracking-widest text-brand-700">{c.code}</td>
                <td className="py-2 pr-6">{c.type === "percentage" ? `${c.value}%` : formatNZD(c.value)} off</td>
                <td className="py-2 pr-6 font-semibold">{c.usedCount}</td>
                <td className="py-2 pr-6 text-foreground/60">{c.maxUses ?? "∞"}</td>
                <td className="py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ivory-200 bg-white p-4">
      <div className="font-serif text-2xl font-semibold text-brand-700">{value}</div>
      <div className="mt-1 text-xs text-foreground/55">{label}</div>
    </div>
  );
}
