// Verify the booking commit (webhook's job) + idempotency, without Stripe.
import { prisma } from "../src/lib/db";
import { createHold } from "../src/lib/availability";
import { commitReservation } from "../src/lib/booking";

async function main() {
  const tour = await prisma.tour.findFirst({ where: { slug: "hanmer-springs-day-tour" }, include: { priceOptions: true } });
  if (!tour) throw new Error("seed first");
  const adult = tour.priceOptions.find((p) => p.key === "adult")!;
  const session = await prisma.session.findFirst({ where: { tourId: tour.id, startsAtUtc: { gt: new Date() } }, orderBy: { startsAtUtc: "asc" } });
  if (!session) throw new Error("no session");

  const line = { priceOptionId: adult.id, key: adult.key, label: adult.label, unitPriceCents: adult.priceCents, qty: 2, seats: 2 };
  const hold = await createHold({ sessionId: session.id, lines: [line], holdMinutes: 10 });
  await prisma.reservation.update({
    where: { id: hold.reservationId },
    data: { contactSnapshot: { fullName: "Verify Tester", email: "verify@example.com", phone: "0211234567", notes: "Hotel ABC" } },
  });

  const fakePi = `pi_test_${hold.reservationId.slice(-8)}`;
  console.log("\n── TEST: commit reservation (simulating webhook) ──");
  const r1 = await commitReservation(hold.reservationId, fakePi);
  console.log(`  first commit → ${r1.reference} (alreadyExisted=${r1.alreadyExisted})`);
  const r2 = await commitReservation(hold.reservationId, fakePi);
  console.log(`  second commit (idempotency) → ${r2.reference} (alreadyExisted=${r2.alreadyExisted})`);
  console.log(`  idempotent: ${r1.reference === r2.reference && r2.alreadyExisted ? "PASS ✅" : "FAIL ❌"}`);

  const booking = await prisma.booking.findUnique({ where: { reference: r1.reference }, include: { items: true, customer: true } });
  console.log(`  booking created: seats=${booking?.seats} total=${booking?.totalCents} items=${booking?.items.length} customer=${booking?.customer.email}`);
  const bookingCount = await prisma.booking.count({ where: { stripePaymentIntentId: fakePi } });
  console.log(`  exactly one booking for PI: ${bookingCount === 1 ? "PASS ✅" : "FAIL ❌"}`);

  const resv = await prisma.reservation.findUnique({ where: { id: hold.reservationId } });
  console.log(`  reservation marked CONVERTED: ${resv?.status === "CONVERTED" ? "PASS ✅" : "FAIL ❌"}`);

  // Cleanup
  if (booking) {
    await prisma.bookingItem.deleteMany({ where: { bookingId: booking.id } });
    await prisma.booking.delete({ where: { id: booking.id } });
    await prisma.customer.delete({ where: { id: booking.customerId } });
  }
  await prisma.reservation.deleteMany({ where: { id: hold.reservationId } });
  console.log("\nCleaned up.\n");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
