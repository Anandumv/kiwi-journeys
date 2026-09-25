import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Install audit-only dependencies outside the application, or set AUDIT_TOOLS.
const require = createRequire(`${process.env.AUDIT_TOOLS || '/tmp/kiwi-audit-tools'}/package.json`);
const { chromium } = require('playwright');
const base = process.env.AUDIT_BASE_URL || 'http://localhost:3100';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Browser flow tests require localhost.');
const out = 'outputs/audit/2026-09-23';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
async function check(name, run) {
  try { await run(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, passed: false, error: String(error) }); console.log(`FAIL ${name}: ${String(error).slice(0,250)}`); }
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await check('Hero video waits for scrolling and respects reduced motion', async () => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(base);
    await page.getByRole('button', { name: /menu/i }).count();
    assert.equal(await page.locator('video').count(), 0);
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.locator('video').waitFor({ state: 'attached' });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('video').waitFor({ state: 'detached' });
  });
  await check('Invalid price link remains usable', async () => {
    await page.goto(`${base}/tours?price=unknown`);
    await page.getByRole('searchbox').waitFor();
    assert.equal(await page.getByRole('combobox', { name: 'Price range' }).inputValue(), 'all');
    assert.equal(errors.length, 0, errors.join('; '));
  });
  await check('Browser history restores tour filters', async () => {
    await page.goto(`${base}/tours?price=u200`);
    await page.getByRole('searchbox').waitFor();
    await page.evaluate(() => window.history.pushState(null, '', '/tours?price=350p'));
    await page.waitForFunction(() => document.querySelector('[aria-label="Price range"]')?.value === '350p');
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('[aria-label="Price range"]')?.value === 'u200');
  });
  await check('Sold-out dates expose the correct departure waitlist', async () => {
    await page.goto(`${base}/tours`);
    const href = await page.locator('a[href^="/tours/"]').first().getAttribute('href');
    assert.ok(href);
    const now = new Date();
    now.setDate(now.getDate() + 1);
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland' }).format(now);
    await page.route('**/api/tours/*/availability?*', route => route.fulfill({ json: { days: [{ date, remaining: 0, sessions: [
      { sessionId: 'audit-sold-out-1', startsAtUtc: `${date}T01:00:00Z`, remaining: 0, capacity: 6 },
      { sessionId: 'audit-sold-out-2', startsAtUtc: `${date}T03:00:00Z`, remaining: 0, capacity: 6 },
    ] }] } }));
    await page.goto(`${base}${href}/book`);
    const day = page.getByRole('button', { name: new RegExp(`^${date}`) });
    await day.waitFor();
    await page.getByText('Loading availability…', { exact: true }).waitFor({ state: 'hidden' });
    assert.equal(await day.isEnabled(), true);
    await day.click();
    await page.getByRole('button', { name: /Sold out/ }).filter({ hasNotText: /^\d{4}-/ }).last().click();
    await page.getByLabel('Full name', { exact: true }).fill('Audit Guest');
    await page.getByLabel('Email', { exact: true }).fill('audit@example.invalid');
    let payload;
    await page.route('**/api/waitlist', async route => { payload = route.request().postDataJSON(); await route.fulfill({ json: { ok: true } }); });
    await page.getByRole('button', { name: 'Join the waitlist', exact: true }).click();
    await page.getByRole('status').filter({ hasText: /on the waitlist/ }).waitFor();
    assert.equal(payload.sessionId, 'audit-sold-out-2');
  });
  await check('Mobile menu closes with Escape and restores focus', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base);
    const toggle = page.getByRole('button', { name: /menu/i });
    await toggle.click();
    await page.keyboard.press('Escape');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
  });
  for (const width of [390, 768, 1280, 1440]) {
    await check(`Homepage layout at ${width}px`, async () => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base);
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.evaluate(async () => { await document.fonts.ready; });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.evaluate(async () => {
        document.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'eager'; });
        await Promise.race([Promise.all([...document.images].map(img => img.decode().catch(() => {}))), new Promise(resolve => setTimeout(resolve, 10000))]);
      });
      await page.screenshot({ path: `${out}/home-${width}.png`, fullPage: true });
      await page.screenshot({ path: `${out}/hero-${width}.png` });
    });
  }
  for (const path of ['/', '/tours', '/contact', '/private-tours', '/gift-vouchers', '/faq', '/about', '/destinations', '/sustainability', '/cruise-excursions', '/travel-insights']) {
    await check(`Accessibility ${path}`, async () => {
      await page.goto(`${base}${path}`);
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const report = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })));
      await writeFile(`${out}/axe-${path.replaceAll('/', '') || 'home'}.json`, JSON.stringify(report, null, 2));
      assert.equal(report.length, 0, JSON.stringify(report));
    });
  }
  await check('Content stays visible without JavaScript', async () => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const nojs = await context.newPage();
    await nojs.goto(base);
    const link = nojs.locator('a[href^="/tours/"]').first();
    assert.equal(await link.evaluate(el => { let n = el; while (n) { if (getComputedStyle(n).opacity === '0') return false; n = n.parentElement; } return true; }), true);
    await context.close();
  });
} finally {
  await browser.close();
  await writeFile(`${out}/browser.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  if (results.some(r => !r.passed)) process.exitCode = 1;
}
