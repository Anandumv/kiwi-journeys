import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

function safeName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : "";
  const base = (dot >= 0 ? name.slice(0, dot) : name).replace(/[^a-z0-9-_]/gi, "-").slice(0, 60);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}-${rand}${ext}`;
}

/**
 * Store an uploaded image. Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set,
 * otherwise writes to public/uploads/ for local development. Returns a public URL.
 */
export async function storeUpload(file: File): Promise<{ url: string }> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Unsupported file type");
  }
  const filename = safeName(file.name || "image.jpg");

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`tours/${filename}`, file, { access: "public", addRandomSuffix: false });
    return { url: blob.url };
  }

  // Local dev fallback.
  const bytes = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return { url: `/uploads/${filename}` };
}
