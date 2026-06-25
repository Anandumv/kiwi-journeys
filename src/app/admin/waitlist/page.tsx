import { prisma } from "@/lib/db";
import { dateLabel } from "@/lib/time";
import { deleteWaitlistEntry, markWaitlistNotified } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Waitlist" };

export default async function AdminWaitlist() {
  const entries = await prisma.waitlist.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const notified = entries.filter((e) => e.notified).length;
  const pending = entries.length - notified;

  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl font-semibold text-brand-900">Waitlist</h1>
      <div className="mt-2 flex gap-6 text-sm text-foreground/60">
        <span><strong className="text-foreground">{pending}</strong> pending</span>
        <span><strong className="text-foreground">{notified}</strong> notified</span>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-ivory-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-ivory text-left text-foreground/60">
            <tr>
              <th className="p-3">Tour</th>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Seats</th>
              <th className="p-3">Added</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-foreground/50">No waitlist entries yet.</td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-ivory-200">
                <td className="p-3 font-medium">{e.tourTitle || e.tourId}</td>
                <td className="p-3">{e.fullName}</td>
                <td className="p-3 text-foreground/70">{e.email}</td>
                <td className="p-3 text-foreground/70">{e.phone ?? "—"}</td>
                <td className="p-3">{e.seats}</td>
                <td className="p-3 text-foreground/60 text-xs">{dateLabel(e.createdAt)}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.notified ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"}`}>
                    {e.notified ? "Notified" : "Pending"}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  {!e.notified && (
                    <form action={markWaitlistNotified}>
                      <input type="hidden" name="id" value={e.id} />
                      <button type="submit" className="text-xs text-brand-600 hover:underline">Mark notified</button>
                    </form>
                  )}
                  <form action={deleteWaitlistEntry}>
                    <input type="hidden" name="id" value={e.id} />
                    <button type="submit" className="text-xs text-red-500 hover:underline">Remove</button>
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
