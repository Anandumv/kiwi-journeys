// End-to-end verification of the booking engine guarantees (no Stripe needed).
import { prisma } from "../src/lib/db";
import { createHold, SoldOutError, remainingForSessions, expireStaleHolds } from "../src/lib/availability";

async function main() {
  const tour = await prisma.tour.findFirst({ where: { slug: "akaroa-day-tour" }, include: { priceOptions: true } });
  if (!tour) throw new Error("seed first");
  const adult = tour.priceOptions.find((p) => p.key === "cruise")!;

  // Pick a fresh future session and reset it to capacity 1 for the overbooking test.
  const session = await prisma.session.findFirst({
    where: { tourId: tour.id, startsAtUtc: { gt: new Date() } },
    orderBy: { startsAtUtc: "asc" },
  });
  if (!session) throw new Error("no future session");
  await prisma.reservation.deleteMany({ where: { sessionId: session.id } });
  await prisma.session.update({ where: { id: session.id }, data: { capacity: 1 } });

  const line = { priceOptionId: adult.id, key: adult.key, label: adult.label, unitPriceCents: adult.priceCents, qty: 1, seats: 1 };

  console.log("\n── TEST 1: Overbooking (capacity=1, two concurrent holds) ──");
  const results = await Promise.allSettled([
    createHold({ sessionId: session.id, lines: [line], holdMinutes: 10 }),
    createHold({ sessionId: session.id, lines: [line], holdMinutes: 10 }),
  ]);
  const ok = results.filter((r) => r.status === "fulfilled").length;
  const soldOut = results.filter((r) => r.status === "rejected" && (r.reason instanceof SoldOutError)).length;
  console.log(`  fulfilled=${ok} soldOut=${soldOut}  → ${ok === 1 && soldOut === 1 ? "PASS ✅" : "FAIL ❌"}`);

  const rem = await remainingForSessions([session.id]);
  console.log(`  remaining now = ${rem.get(session.id)} (expect 0) → ${rem.get(session.id) === 0 ? "PASS ✅" : "FAIL ❌"}`);

  console.log("\n── TEST 2: Hold expiry frees seats ──");
  // Expire the winning hold by backdating it, then sweep.
  await prisma.reservation.updateMany({
    where: { sessionId: session.id, status: "HELD" },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });
  const remBefore = await remainingForSessions([session.id]);
  console.log(`  remaining with expired hold (live filter) = ${remBefore.get(session.id)} (expect 1) → ${remBefore.get(session.id) === 1 ? "PASS ✅" : "FAIL ❌"}`);
  const expired = await expireStaleHolds();
  console.log(`  swept ${expired.length} stale hold(s)`);

  console.log("\n── TEST 3: Successful hold after sweep ──");
  try {
    const h = await createHold({ sessionId: session.id, lines: [line], holdMinutes: 10 });
    console.log(`  hold created total=${h.totalCents} seats=${h.seats} → PASS ✅`);
  } catch (e) {
    console.log(`  FAIL ❌ ${e}`);
  }

  // Cleanup: restore capacity and clear test holds.
  await prisma.reservation.deleteMany({ where: { sessionId: session.id } });
  await prisma.session.update({ where: { id: session.id }, data: { capacity: tour.priceOptions.length && 14 } });
  console.log("\nCleaned up test data.\n");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
