import { prisma } from "@/lib/db";
import { saveSettings } from "../actions";
import { SingleImageField } from "@/components/admin/ImageFields";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site Settings — Admin" };

const input = "w-full rounded-lg border border-ivory-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none mt-1";

function J(v: unknown) { return JSON.stringify(v, null, 2); }

export default async function AdminSettings() {
  const s = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });
  if (!s) return <div className="p-8">Run the seed first.</div>;

  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl font-semibold text-brand-900">Site Settings</h1>
      <form action={saveSettings} className="mt-6 max-w-3xl space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Brand name<input name="name" defaultValue={s.name} className={input} /></label>
          <label className="text-sm">Tagline<input name="tagline" defaultValue={s.tagline} className={input} /></label>
          <label className="text-sm">Currency<input name="currency" defaultValue={s.currency} className={input} /></label>
          <label className="text-sm">Phone<input name="phone" defaultValue={s.phone} className={input} /></label>
          <label className="text-sm">Phone href<input name="phoneHref" defaultValue={s.phoneHref} className={input} placeholder="tel:+64..." /></label>
          <label className="text-sm">Email<input name="email" defaultValue={s.email} className={input} /></label>
          <label className="text-sm">Address<input name="address" defaultValue={s.address} className={input} /></label>
        </div>
        <label className="block text-sm">Description<textarea name="description" rows={2} defaultValue={s.description} className={input} /></label>
        <label className="block text-sm">Footer tagline<textarea name="footerTagline" rows={2} defaultValue={s.footerTagline} className={input} /></label>

        <div className="grid gap-5 sm:grid-cols-2">
          <SingleImageField name="logoImage" label="Logo (optional — falls back to wordmark)" defaultValue={s.logoImage ?? ""} />
          <SingleImageField name="heroImage" label="Homepage hero image" defaultValue={s.heroImage} />
        </div>

        <p className="text-sm font-semibold text-brand-800">Structured content (JSON)</p>
        <label className="block text-sm">Navigation<textarea name="nav" rows={5} defaultValue={J(s.nav)} className={`${input} font-mono text-xs`} /></label>
        <label className="block text-sm">Stats<textarea name="stats" rows={4} defaultValue={J(s.stats)} className={`${input} font-mono text-xs`} /></label>
        <label className="block text-sm">Value props<textarea name="valueProps" rows={5} defaultValue={J(s.valueProps)} className={`${input} font-mono text-xs`} /></label>
        <label className="block text-sm">Social links<textarea name="social" rows={3} defaultValue={J(s.social)} className={`${input} font-mono text-xs`} /></label>
        <label className="block text-sm">Currency rates (1 NZD = …)<textarea name="currencyRates" rows={4} defaultValue={J(s.currencyRates)} className={`${input} font-mono text-xs`} /></label>

        <button className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700">Save settings</button>
      </form>
    </div>
  );
}
