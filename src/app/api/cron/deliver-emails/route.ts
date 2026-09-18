import { NextResponse } from "next/server";
import { processEmailJobs } from "@/lib/email-jobs";
import { cronAuthorized } from "@/lib/cron";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await processEmailJobs();
  return NextResponse.json(result, { status: result.unavailable ? 503 : 200 });
}
