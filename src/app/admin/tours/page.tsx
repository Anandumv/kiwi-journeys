import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatNZD } from "@/lib/money";
import { deleteTour } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tours — Admin" };

export default async function AdminTours() {
  const now = new Date();
  const tours = await prisma.tour.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { sessions: true } }, sessions: { where: { startsAtUtc: { gt: now }, status: "SCHEDULED" }, select: { id: true } } },
  });
  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold text-brand-900">Tours</h1>
        <Link href="/admin/tours/new" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">+ New tour</Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-ivory-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-ivory text-left text-foreground/60">
            <tr><th className="p-3">Title</th><th className="p-3">Code</th><th className="p-3">From</th><th className="p-3">Upcoming</th><th className="p-3">Active</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {tours.map((t) => (
              <tr key={t.id} className="border-t border-ivory-200">
                <td className="p-3 font-medium text-brand-800">{t.title}</td>
                <td className="p-3 text-foreground/60">{t.code}</td>
                <td className="p-3">{formatNZD(t.priceFromCents)}</td>
                <td className="p-3">{t.sessions.length}</td>
                <td className="p-3">{t.isActive ? "✓" : "—"}</td>
                <td className="p-3 text-right">
                  <Link href={`/admin/tours/${t.id}`} className="mr-3 font-medium text-brand-600 hover:underline">Edit</Link>
                  <form action={deleteTour} className="inline">
                    <input type="hidden" name="id" value={t.id} />
                    <button className="text-red-600 hover:underline">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
