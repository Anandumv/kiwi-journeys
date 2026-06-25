import Image from "next/image";
import { prisma } from "@/lib/db";
import { MediaUploader } from "@/components/admin/MediaUploader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Media — Admin" };

export default async function AdminMedia() {
  const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl font-semibold text-brand-900">Media Library</h1>
      <p className="mt-2 text-sm text-foreground/55">Uploaded images. Copy a URL to paste into any image field.</p>
      <div className="mt-6"><MediaUploader /></div>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {media.map((m) => (
          <div key={m.id} className="group overflow-hidden rounded-lg border border-ivory-200 bg-white">
            <div className="relative aspect-square"><Image src={m.url} alt={m.alt ?? ""} fill className="object-cover" sizes="160px" /></div>
            <input readOnly value={m.url} className="w-full truncate border-t border-ivory-200 px-2 py-1 text-[10px] text-foreground/50" onFocus={(e) => e.currentTarget.select()} />
          </div>
        ))}
        {media.length === 0 && <p className="col-span-full text-sm text-foreground/50">No uploads yet.</p>}
      </div>
    </div>
  );
}
