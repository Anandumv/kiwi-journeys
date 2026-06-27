import { prisma } from "@/lib/db";
import { savePost, deletePost } from "../actions";
import { SingleImageField } from "@/components/admin/ImageFields";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog — Admin" };

const input = "w-full rounded-lg border border-ivory-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none mt-1";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  coverImage: string | null;
  published: boolean;
  date: Date;
  category: string;
  tags: string[];
  metaDescription: string | null;
};

function PostForm({ p }: { p?: Post }) {
  return (
    <form action={savePost} className="space-y-3 rounded-xl border border-ivory-200 bg-white p-5">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Title<input name="title" defaultValue={p?.title} className={input} required /></label>
        <label className="text-sm">Slug<input name="slug" defaultValue={p?.slug} className={input} required /></label>
        <label className="text-sm">Date<input name="date" type="date" defaultValue={(p?.date ?? new Date()).toISOString().slice(0, 10)} className={input} /></label>
        <label className="flex items-center gap-2 text-sm pt-5"><input type="checkbox" name="published" defaultChecked={p?.published ?? true} /> Published</label>
        <label className="text-sm">
          Category
          <select name="category" defaultValue={p?.category ?? "general"} className={input}>
            <option value="general">General</option>
            <option value="travel-tips">Travel Tips</option>
            <option value="destination-guides">Destination Guides</option>
            <option value="tour-highlights">Tour Highlights</option>
            <option value="news">News</option>
          </select>
        </label>
        <label className="text-sm">
          Tags <span className="font-normal text-foreground/40">(comma-separated)</span>
          <input name="tags" defaultValue={(p?.tags ?? []).join(", ")} className={input} placeholder="akaroa, dolphins, day-trip" />
        </label>
      </div>
      <label className="block text-sm">
        Meta Description <span className="font-normal text-foreground/40">(160 chars for SEO)</span>
        <textarea name="metaDescription" rows={2} defaultValue={p?.metaDescription ?? ""} className={input} maxLength={160} placeholder="Concise description for search results…" />
      </label>
      <label className="block text-sm">Excerpt<input name="excerpt" defaultValue={p?.excerpt} className={input} /></label>
      <label className="block text-sm">
        Body <span className="text-xs text-foreground/45">(separate paragraphs with a blank line)</span>
        <textarea name="body" rows={8} defaultValue={(p?.body ?? []).join("\n\n")} className={input} />
      </label>
      <SingleImageField name="coverImage" label="Cover image" defaultValue={p?.coverImage ?? ""} />
      <div className="flex gap-3">
        <button className="rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700">Save</button>
        {p && <button formAction={deletePost} className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Delete</button>}
      </div>
    </form>
  );
}

export default async function AdminBlog() {
  const posts = await prisma.blogPost.findMany({ orderBy: { date: "desc" } });
  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl font-semibold text-brand-900">Blog</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/55">New post</h2>
          <PostForm />
        </div>
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/55">Existing ({posts.length})</h2>
          {posts.map((p) => (
            <details key={p.id} className="rounded-xl border border-ivory-200 bg-white">
              <summary className="cursor-pointer px-5 py-3 font-medium text-brand-800">
                {p.title}
                {p.category !== "general" && <span className="ml-2 text-xs text-brand-400">[{p.category}]</span>}
                {!p.published && <span className="ml-1 text-xs text-amber-600">(draft)</span>}
              </summary>
              <div className="p-4 pt-0"><PostForm p={p} /></div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
