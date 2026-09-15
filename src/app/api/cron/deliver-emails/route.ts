import { NextResponse } from "next/server";
import { processEmailJobs } from "@/lib/email-jobs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await processEmailJobs();
  return NextResponse.json(result, { status: result.unavailable ? 503 : 200 });
}
