import { NextResponse } from "next/server";
import { storeUpload } from "@/lib/upload";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Only image files are allowed (JPEG, PNG, GIF, WebP, AVIF)." }, { status: 415 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Maximum size is 10 MB." }, { status: 413 });
  }
  try {
    const { url } = await storeUpload(file);
    await prisma.media.create({ data: { url, alt: file.name } });
    return NextResponse.json({ url });
  } catch (e) {
    console.error("Upload failed:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 500 });
  }
}
