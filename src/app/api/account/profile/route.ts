import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentCustomer();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await prisma.customer.findFirst({
    where: { email: session.email },
    orderBy: { createdAt: "desc" },
    select: {
      country: true,
      travelStyle: true,
      groupType: true,
      ageGroup: true,
      isCruisePassenger: true,
      referralSource: true,
      marketingConsent: true,
      smsConsent: true,
    },
  });

  return NextResponse.json(customer ?? {});
}

const schema = z.object({
  country: z.string().max(100).optional(),
  travelStyle: z.array(z.string()).optional(),
  groupType: z.string().max(50).optional(),
  ageGroup: z.string().max(20).optional(),
  isCruisePassenger: z.boolean().optional(),
  referralSource: z.string().max(100).optional(),
  marketingConsent: z.boolean().optional(),
  smsConsent: z.boolean().optional(),
});

export async function PUT(req: Request) {
  const session = await getCurrentCustomer();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  // Update all Customer records for this email (one per booking).
  await prisma.customer.updateMany({
    where: { email: session.email },
    data: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
