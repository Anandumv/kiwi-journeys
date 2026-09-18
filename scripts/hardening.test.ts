import { test } from "node:test";
import assert from "node:assert/strict";
import { rateLimit, rateLimitKey, __resetRateLimits } from "../src/lib/rate-limit";
import { randomCode, makeBookingReference, makeVoucherCode } from "../src/lib/codes";
import { safeName } from "../src/lib/upload";
import { gstComponentCents, exGstCents, gstSummary } from "../src/lib/money";

test("rate limiter blocks once the window limit is reached", () => {
  __resetRateLimits();
  const opts = { limit: 3, windowMs: 60_000 };
  assert.equal(rateLimit("k", opts).allowed, true);
  assert.equal(rateLimit("k", opts).allowed, true);
  assert.equal(rateLimit("k", opts).allowed, true);
  assert.equal(rateLimit("k", opts).allowed, false);
});

test("rate limiter counts each client key separately", () => {
  __resetRateLimits();
  const opts = { limit: 1, windowMs: 60_000 };
  assert.equal(rateLimit("a", opts).allowed, true);
  assert.equal(rateLimit("b", opts).allowed, true);
  assert.equal(rateLimit("a", opts).allowed, false);
});

test("rate limiter starts a fresh window after expiry", async () => {
  __resetRateLimits();
  const opts = { limit: 1, windowMs: 1 };
  assert.equal(rateLimit("k", opts).allowed, true);
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(rateLimit("k", opts).allowed, true);
});

test("rate limit key uses the first forwarded client IP", () => {
  const req = new Request("https://example.com", {
    headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
  });
  assert.equal(rateLimitKey(req, "reservation"), "reservation:203.0.113.9");
});

test("codes avoid characters that are ambiguous when read aloud", () => {
  const sample = Array.from({ length: 200 }, () => randomCode(8)).join("");
  for (const ch of ["O", "0", "I", "1"]) {
    assert.equal(sample.includes(ch), false, `code alphabet must not contain ${ch}`);
  }
});

test("booking references and voucher codes are unpredictable", () => {
  // Bearer values: a voucher carries a real balance, so collisions or
  // predictable sequences are a security problem, not just a UX one.
  const refs = new Set(Array.from({ length: 2000 }, makeBookingReference));
  assert.equal(refs.size, 2000, "booking references must not repeat");
  const vouchers = new Set(Array.from({ length: 2000 }, makeVoucherCode));
  assert.equal(vouchers.size, 2000, "voucher codes must not repeat");
});

test("codes keep their documented shape", () => {
  assert.match(makeBookingReference(), /^KJ-[A-HJ-NP-Z2-9]{6}$/);
  assert.match(makeVoucherCode(), /^GV-[A-HJ-NP-Z2-9]{8}$/);
});

test("upload extension comes from the validated MIME type, not the filename", () => {
  // file.type and file.name are both client-supplied. Trusting the filename
  // would store "payload.html" and serve it as HTML from our own origin.
  assert.match(safeName("payload.html", "image/png"), /\.png$/);
  assert.match(safeName("evil.svg", "image/jpeg"), /\.jpg$/);
  assert.match(safeName("shell.php", "image/webp"), /\.webp$/);
});

test("upload names strip path traversal and keep a usable base", () => {
  const name = safeName("../../etc/passwd.png", "image/png");
  assert.equal(name.includes("/"), false);
  assert.equal(name.includes(".."), false);
  assert.match(name, /\.png$/);
});

test("upload names are unique for the same source filename", () => {
  const names = new Set(Array.from({ length: 500 }, () => safeName("beach.jpg", "image/jpeg")));
  assert.equal(names.size, 500);
});

test("GST is extracted from an inclusive price, not added to it", () => {
  // NZ prices are advertised GST-inclusive, so a $115.00 tour contains $15.00
  // of GST — it does not become $132.25 at checkout.
  assert.equal(gstComponentCents(11500), 1500);
  assert.equal(exGstCents(11500), 10000);
});

test("GST component and ex-GST portion always reconstruct the total", () => {
  for (const total of [0, 1, 99, 100, 18500, 29999, 1234567]) {
    assert.equal(gstComponentCents(total) + exGstCents(total), total, `failed for ${total}`);
  }
});

test("GST summary is withheld when no GST number is configured", () => {
  const prior = process.env.GST_NUMBER;
  delete process.env.GST_NUMBER;
  assert.equal(gstSummary(11500), null);
  process.env.GST_NUMBER = "123-456-789";
  assert.deepEqual(gstSummary(11500), { number: "123-456-789", gstCents: 1500, exGstCents: 10000 });
  if (prior === undefined) delete process.env.GST_NUMBER;
  else process.env.GST_NUMBER = prior;
});
