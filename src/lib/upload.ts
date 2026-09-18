import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomCode } from "./codes";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

// The stored extension is derived from the validated MIME type, never from the
// uploaded filename. `file.type` and the filename are both client-supplied, so
// trusting the filename would let "payload.html" declared as image/png be
// written and then served as HTML from our own origin (stored XSS).
const EXT_FOR_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

export function safeName(name: string, type: string): string {
  const ext = EXT_FOR_TYPE[type] ?? ".bin";
  const dot = name.lastIndexOf(".");
  const base =
    (dot >= 0 ? name.slice(0, dot) : name).replace(/[^a-z0-9-_]/gi, "-").slice(0, 60) || "upload";
  return `${base}-${randomCode(8)}${ext}`;
}

/**
 * Store an uploaded image. Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set,
 * otherwise writes to public/uploads/ for local development. Returns a public URL.
 */
export async function storeUpload(file: File): Promise<{ url: string }> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Unsupported file type");
  }
  const filename = safeName(file.name || "image", file.type);

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
