import { prisma } from "@/lib/db";
import { saveTestimonial, deleteTestimonial } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Testimonials — Admin" };

const input = "w-full rounded-lg border border-ivory-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none mt-1";

function TForm({ t }: { t?: { id: string; name: string; country: string; text: string; rating: number; sortOrder: number; published: boolean } }) {
  return (
    <form action={saveTestimonial} className="space-y-3 rounded-xl border border-ivory-200 bg-white p-5">
      {t && <input type="hidden" name="id" value={t.id} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">Name<input name="name" defaultValue={t?.name} className={input} required /></label>
        <label className="text-sm">Country<input name="country" defaultValue={t?.country} className={input} /></label>
        <label className="text-sm">Rating<input name="rating" type="number" min={1} max={5} defaultValue={t?.rating ?? 5} className={input} /></label>
      </div>
      <label className="block text-sm">Quote<textarea name="text" rows={2} defaultValue={t?.text} className={input} required /></label>
      <div className="flex items-center gap-4">
        <label className="text-sm">Sort<input name="sortOrder" type="number" defaultValue={t?.sortOrder ?? 0} className={`${input} w-24`} /></label>
        <label className="flex items-center gap-2 text-sm pt-4"><input type="checkbox" name="published" defaultChecked={t?.published ?? true} /> Published</label>
      </div>
      <div className="flex gap-3">
        <button className="rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700">Save</button>
        {t && <button formAction={deleteTestimonial} className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Delete</button>}
      </div>
    </form>
  );
}

export default async function AdminTestimonials() {
  const items = await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl font-semibold text-brand-900">Testimonials</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div><h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/55">Add new</h2><TForm /></div>
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/55">Existing ({items.length})</h2>
          {items.map((t) => <details key={t.id} className="rounded-xl border border-ivory-200 bg-white"><summary className="cursor-pointer px-5 py-3 font-medium text-brand-800">{t.name} <span className="text-xs text-foreground/45">· {t.country}</span></summary><div className="p-4 pt-0"><TForm t={t} /></div></details>)}
        </div>
      </div>
    </div>
  );
}
