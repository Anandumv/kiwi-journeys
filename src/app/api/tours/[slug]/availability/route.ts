import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMonthAvailability } from "@/lib/availability";

export const dynamic = "force-dynamic";

// GET /api/tours/[slug]/availability?month=YYYY-MM
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "2026-07"

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Invalid month (expected YYYY-MM)" }, { status: 400 });
  }
  const [year, mon] = month.split("-").map(Number);

  const tour = await prisma.tour.findUnique({ where: { slug, isActive: true }, select: { id: true } });
  if (!tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });

  const days = await getMonthAvailability(tour.id, year, mon);
  return NextResponse.json({ month, days });
}
