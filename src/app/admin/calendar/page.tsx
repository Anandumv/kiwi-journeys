import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Departure Calendar" };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default async function AdminCalendar({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? parseInt(sp.year) : now.getFullYear();
  const month = sp.month ? parseInt(sp.month) - 1 : now.getMonth(); // 0-indexed

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Sessions for this month — localDate is stored as Date (midnight UTC)
  const sessions = await prisma.session.findMany({
    where: {
      localDate: { gte: firstDay, lte: lastDay },
      status: "SCHEDULED",
    },
    include: { tour: { select: { title: true } } },
    orderBy: { startsAtUtc: "asc" },
  });

  // Group by YYYY-MM-DD string
  const byDay = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const key = `${s.localDate.getUTCFullYear()}-${pad(s.localDate.getUTCMonth() + 1)}-${pad(s.localDate.getUTCDate())}`;
    const existing = byDay.get(key) ?? [];
    existing.push(s);
    byDay.set(key, existing);
  }

  // Build calendar grid
  const startWeekday = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Prev / next month links
  const prevDate = new Date(year, month - 1, 1);
  const nextDate = new Date(year, month + 1, 1);
  const prevHref = `/admin/calendar?year=${prevDate.getFullYear()}&month=${prevDate.getMonth() + 1}`;
  const nextHref = `/admin/calendar?year=${nextDate.getFullYear()}&month=${nextDate.getMonth() + 1}`;
  const monthLabel = firstDay.toLocaleString("en-NZ", { month: "long", year: "numeric" });

  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold text-brand-900">Departure Calendar</h1>
        <div className="flex items-center gap-3">
          <Link href={prevHref} className="rounded-lg border border-ivory-200 px-3 py-1.5 text-sm hover:bg-ivory">
            ← Prev
          </Link>
          <span className="text-sm font-medium text-foreground/80">{monthLabel}</span>
          <Link href={nextHref} className="rounded-lg border border-ivory-200 px-3 py-1.5 text-sm hover:bg-ivory">
            Next →
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-ivory-200 bg-white overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-ivory-200 bg-ivory">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="p-3 text-center text-xs font-semibold text-foreground/60">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) {
              return <div key={`empty-${i}`} className="min-h-24 border-b border-r border-ivory-200 bg-ivory/40" />;
            }
            const key = `${year}-${pad(month + 1)}-${pad(day)}`;
            const daySessions = byDay.get(key) ?? [];
            const isToday = key === todayStr;

            return (
              <div
                key={key}
                className={`min-h-24 border-b border-r border-ivory-200 p-2 ${isToday ? "bg-brand-50" : ""}`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday ? "bg-brand-600 text-white" : "text-foreground/70"
                  }`}
                >
                  {day}
                </span>
                {daySessions.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {daySessions.slice(0, 2).map((s) => (
                      <div
                        key={s.id}
                        className="truncate rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-700"
                        title={s.tour.title}
                      >
                        {s.tour.title}
                      </div>
                    ))}
                    {daySessions.length > 2 && (
                      <div className="pl-1 text-[10px] text-foreground/50">
                        +{daySessions.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-sm text-foreground/50">
        {sessions.length} departure{sessions.length !== 1 ? "s" : ""} scheduled in {monthLabel}.
      </p>
    </div>
  );
}
