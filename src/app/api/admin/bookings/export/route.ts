import { BookingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatNZD } from "@/lib/money";
import { dateLabel, timeLabel } from "@/lib/time";

export const dynamic = "force-dynamic";
// Route is protected by proxy.ts admin middleware — no extra session check needed.

const STATUSES: BookingStatus[] = ["CONFIRMED", "REFUNDED", "CANCELLED"];

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function csvRow(fields: string[]): string {
  return fields.map(csvCell).join(",");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "";
  const validStatus = STATUSES.includes(status as BookingStatus) ? (status as BookingStatus) : undefined;

  const bookings = await prisma.booking.findMany({
    where: {
      ...(validStatus && { status: validStatus }),
      ...(q && {
        OR: [
          { reference: { contains: q, mode: "insensitive" } },
          { customer: { fullName: { contains: q, mode: "insensitive" } } },
          { customer: { email: { contains: q, mode: "insensitive" } } },
        ],
      }),
    },
    include: { session: { include: { tour: true } }, customer: true },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  const header = csvRow([
    "Reference", "Name", "Email", "Phone", "Tour",
    "Departure Date", "Departure Time", "Seats", "Total NZD", "Status", "Booked At",
  ]);

  const rows = bookings.map((b) =>
    csvRow([
      b.reference,
      b.customer.fullName,
      b.customer.email,
      b.customer.phone ?? "",
      b.session.tour.title,
      dateLabel(b.session.startsAtUtc),
      timeLabel(b.session.startsAtUtc),
      String(b.seats),
      formatNZD(b.totalCents),
      b.status,
      b.createdAt.toISOString(),
    ])
  );

  const csv = [header, ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-${date}.csv"`,
    },
  });
}
