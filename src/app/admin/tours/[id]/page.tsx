import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { saveTour, regenerateDepartures, cancelSession, addSession } from "../../actions";
import { MultiImageField } from "@/components/admin/ImageFields";
import { dateLabel, timeLabel, todayInAuckland } from "@/lib/time";

export const dynamic = "force-dynamic";

const input = "w-full rounded-lg border border-ivory-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none";
const labelCls = "block text-sm font-medium text-foreground/80";

function Field({ label, name, defaultValue, placeholder, type = "text" }: { label: string; name: string; defaultValue?: string | number; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <input className={`${input} mt-1`} name={name} defaultValue={defaultValue} placeholder={placeholder} type={type} />
    </label>
  );
}
function Area({ label, name, defaultValue, rows = 4, hint }: { label: string; name: string; defaultValue?: string; rows?: number; hint?: string }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}{hint && <span className="ml-2 text-xs font-normal text-foreground/45">{hint}</span>}</span>
      <textarea className={`${input} mt-1`} name={name} rows={rows} defaultValue={defaultValue} />
    </label>
  );
}

export default async function TourEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const tour = isNew ? null : await prisma.tour.findUnique({ where: { id }, include: { priceOptions: { orderBy: { sortOrder: "asc" } } } });
  if (!isNew && !tour) notFound();

  const sessions = tour ? await prisma.session.findMany({
    where: { tourId: tour.id, startsAtUtc: { gt: new Date() } }, orderBy: { startsAtUtc: "asc" }, take: 40,
    include: { _count: { select: { bookings: true } } },
  }) : [];

  const priceOptionsText = (tour?.priceOptions ?? []).map((p) => `${p.key} | ${p.label} | ${(p.priceCents / 100).toFixed(2)} | ${p.seatsPerUnit}`).join("\n");

  return (
    <div className="p-8">
      <Link href="/admin/tours" className="text-sm font-semibold text-brand-600 hover:underline">← All tours</Link>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-brand-900">{isNew ? "New tour" : tour!.title}</h1>

      <form action={saveTour} className="mt-6 max-w-3xl space-y-5">
        {!isNew && <input type="hidden" name="id" value={tour!.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" name="title" defaultValue={tour?.title} />
          <Field label="Slug" name="slug" defaultValue={tour?.slug} placeholder="akaroa-day-tour" />
          <Field label="Tour code" name="code" defaultValue={tour?.code} />
          <Field label="Category" name="category" defaultValue={tour?.category} placeholder="iconic-day-trips | wildlife | adventure | wine-food" />
          <Field label="Destination" name="destination" defaultValue={tour?.destination} />
          <Field label="Destination slug" name="destinationSlug" defaultValue={tour?.destinationSlug} placeholder="christchurch" />
          <Field label="Duration label" name="durationLabel" defaultValue={tour?.durationLabel} placeholder="1 Day" />
          <Field label="Duration (minutes)" name="durationMins" type="number" defaultValue={tour?.durationMins} />
          <Field label="Age range" name="ageRange" defaultValue={tour?.ageRange} />
          <Field label="Route (start → end)" name="startEnd" defaultValue={tour?.startEnd} />
        </div>
        <Area label="Pickup info" name="pickup" rows={2} defaultValue={tour?.pickup} />
        <Area label="Summary" name="summary" rows={3} defaultValue={tour?.summary} />
        <Area label="Long description (optional)" name="descriptionLong" rows={3} defaultValue={tour?.descriptionLong ?? ""} />

        <MultiImageField name="gallery" label="Gallery images" defaultValue={tour?.gallery ?? []} />

        <Area label="Highlights" name="highlights" hint="one per line" defaultValue={(tour?.highlights ?? []).join("\n")} />
        <Area label="Itinerary steps" name="itinerary" hint="one paragraph per line" rows={6} defaultValue={(tour?.itinerary ?? []).join("\n")} />
        <Area label="What's included" name="included" hint="one per line" defaultValue={(tour?.included ?? []).join("\n")} />
        <Area label="Optional upgrades" name="optionalUpgrades" hint="one per line" rows={2} defaultValue={(tour?.optionalUpgrades ?? []).join("\n")} />
        <Area label="Important info" name="importantInfo" hint="one per line" rows={2} defaultValue={(tour?.importantInfo ?? []).join("\n")} />

        <Area label="Price options" name="priceOptions" hint="one per line: key | label | dollars | seatsPerUnit" rows={4} defaultValue={priceOptionsText} />

        <div className="rounded-xl border border-ivory-200 bg-ivory/50 p-4">
          <p className="text-sm font-semibold text-brand-800">Departure schedule</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Departure times" name="departureTimes" defaultValue={(tour?.departureTimes ?? []).join(", ")} placeholder="08:30, 13:30" />
            <Field label="Weekdays (1=Mon..7=Sun)" name="departureWeekdays" defaultValue={(tour?.departureWeekdays ?? []).join(", ")} placeholder="1,2,3,4,5,6,7" />
            <Field label="Capacity per departure" name="capacityPerDeparture" type="number" defaultValue={tour?.capacityPerDeparture ?? 12} />
            <Field label="Closed months (1-12)" name="closedMonths" defaultValue={(tour?.closedMonths ?? []).join(", ")} placeholder="5,6,7,8" />
          </div>
          <p className="mt-2 text-xs text-foreground/50">After saving, use “Regenerate departures” below to create sessions from this schedule.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sort order" name="sortOrder" type="number" defaultValue={tour?.sortOrder ?? 0} />
          <div className="flex items-end gap-6 pb-1">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={tour?.featured ?? false} /> Featured</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={tour?.isActive ?? true} /> Active</label>
          </div>
        </div>

        <button className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700">Save tour</button>
      </form>

      {!isNew && (
        <section className="mt-12 max-w-3xl">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-brand-900">Upcoming departures</h2>
            <form action={regenerateDepartures}>
              <input type="hidden" name="id" value={tour!.id} />
              <button className="rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">Regenerate departures (90 days)</button>
            </form>
          </div>

          <form action={addSession} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-ivory-200 bg-white p-4">
            <input type="hidden" name="tourId" value={tour!.id} />
            <label className="text-sm">Date<input type="date" name="date" defaultValue={todayInAuckland()} className={`${input} mt-1`} /></label>
            <label className="text-sm">Time<input type="time" name="time" defaultValue="08:30" className={`${input} mt-1`} /></label>
            <label className="text-sm">Capacity<input type="number" name="capacity" defaultValue={tour!.capacityPerDeparture} className={`${input} mt-1 w-24`} /></label>
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Add one-off</button>
          </form>

          <div className="mt-4 overflow-x-auto rounded-xl border border-ivory-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-ivory text-left text-foreground/60"><tr><th className="p-3">Date</th><th className="p-3">Time</th><th className="p-3">Capacity</th><th className="p-3">Booked</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-t border-ivory-200">
                    <td className="p-3">{dateLabel(s.startsAtUtc)}</td>
                    <td className="p-3">{timeLabel(s.startsAtUtc)}</td>
                    <td className="p-3">{s.capacity}</td>
                    <td className="p-3">{s._count.bookings}</td>
                    <td className="p-3">{s.status}</td>
                    <td className="p-3 text-right">
                      {s.status === "SCHEDULED" && (
                        <form action={cancelSession} className="inline">
                          <input type="hidden" name="sessionId" value={s.id} />
                          <input type="hidden" name="tourId" value={tour!.id} />
                          <button className="text-red-600 hover:underline">Cancel</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-foreground/50">No upcoming departures. Use “Regenerate departures”.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
