import { prisma } from "@/lib/db";
import { saveDestination, deleteDestination } from "../actions";
import { SingleImageField } from "@/components/admin/ImageFields";

export const dynamic = "force-dynamic";
export const metadata = { title: "Destinations — Admin" };

const input = "w-full rounded-lg border border-ivory-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none mt-1";

function DestForm({ d }: { d?: { id: string; slug: string; name: string; status: string; blurb: string; intro: string | null; heroImage: string | null; sortOrder: number } }) {
  return (
    <form action={saveDestination} className="space-y-3 rounded-xl border border-ivory-200 bg-white p-5">
      {d && <input type="hidden" name="id" value={d.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Name<input name="name" defaultValue={d?.name} className={input} required /></label>
        <label className="text-sm">Slug<input name="slug" defaultValue={d?.slug} className={input} required /></label>
        <label className="text-sm">Status<select name="status" defaultValue={d?.status ?? "active"} className={input}><option value="active">active</option><option value="coming-soon">coming-soon</option></select></label>
        <label className="text-sm">Sort order<input name="sortOrder" type="number" defaultValue={d?.sortOrder ?? 0} className={input} /></label>
      </div>
      <label className="block text-sm">Blurb<input name="blurb" defaultValue={d?.blurb} className={input} /></label>
      <label className="block text-sm">Intro (shown on region page)<textarea name="intro" rows={2} defaultValue={d?.intro ?? ""} className={input} /></label>
      <SingleImageField name="heroImage" label="Hero image" defaultValue={d?.heroImage ?? ""} />
      <div className="flex gap-3">
        <button className="rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700">Save</button>
        {d && (
          <button formAction={deleteDestination} className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Delete</button>
        )}
      </div>
    </form>
  );
}

export default async function AdminDestinations() {
  const destinations = await prisma.destination.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl font-semibold text-brand-900">Destinations</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/55">Add new</h2>
          <DestForm />
        </div>
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/55">Existing ({destinations.length})</h2>
          {destinations.map((d) => <details key={d.id} className="rounded-xl border border-ivory-200 bg-white"><summary className="cursor-pointer px-5 py-3 font-medium text-brand-800">{d.name} <span className="text-xs text-foreground/45">/{d.slug} · {d.status}</span></summary><div className="p-4 pt-0"><DestForm d={d} /></div></details>)}
        </div>
      </div>
    </div>
  );
}
