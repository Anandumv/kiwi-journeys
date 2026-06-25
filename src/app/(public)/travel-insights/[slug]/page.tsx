import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPost } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return post ? { title: post.title, description: post.excerpt } : { title: "Post" };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <Link href="/travel-insights" className="text-sm font-semibold text-brand-600 hover:underline">← All insights</Link>
      <time className="mt-6 block text-xs font-medium uppercase tracking-wider text-brand-500">
        {new Date(post.date).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}
      </time>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-brand-900 text-balance">{post.title}</h1>
      <div className="mt-8 space-y-5 text-lg leading-relaxed text-foreground/80">
        {post.body.map((para, i) => <p key={i}>{para}</p>)}
      </div>
    </article>
  );
}
