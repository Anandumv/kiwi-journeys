import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const require = createRequire(`${process.env.AUDIT_TOOLS || '/tmp/kiwi-audit-tools'}/package.json`);
const { chromium } = require('playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const [width, height] of [[375, 667], [390, 900], [1440, 900]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'no-preference' });
    await page.goto('http://localhost:3101/', { waitUntil: 'networkidle' });
    const hero = page.locator('section[aria-labelledby="home-title"]');
    const windowFrame = hero.locator('div[class*="_carriageWindow_"]').first();
    const initial = await windowFrame.boundingBox();
    const title = await page.locator('#home-title').boundingBox();
    const controls = await page.locator('div[class*="_windowControls_"]').boundingBox();
    if (width < 760) {
      assert.ok(title.y + title.height <= initial.y, 'Title clears the glass');
      assert.ok(initial.y + initial.height <= controls.y + 2, 'Controls sit below the glass');
      const intro = await page.getByText('South Island day tours & private day trips', { exact: true }).evaluate(el => { const range = document.createRange(); range.selectNodeContents(el); const rect = range.getBoundingClientRect(); return { y: rect.y, height: rect.height }; });
      assert.ok(controls.y + controls.height <= intro.y, `Controls clear the tour copy: ${JSON.stringify({width,controls,intro})}`);
    }
    await page.screenshot({ path: `outputs/audit/2026-09-23/window-initial-${width}.png`, fullPage: width < 390 });
    const viewImage = hero.locator('img').first();
    const originalImage = await viewImage.getAttribute('src');
    await page.getByRole('button', { name: 'High country', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'High country', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.notEqual(await viewImage.getAttribute('src'), originalImage);
    assert.match(await page.getByRole('link', { name: /Explore this day out/ }).getAttribute('href'), /tekapo/);
    await page.getByRole('button', { name: 'Harbour', exact: true }).click();
    assert.match(await page.getByRole('link', { name: /Explore this day out/ }).getAttribute('href'), /akaroa/);
    await page.getByRole('button', { name: 'Coast', exact: true }).click();
    const distance = await hero.evaluate(el => el.getBoundingClientRect().top + scrollY + el.offsetHeight - el.firstElementChild.getBoundingClientRect().height);
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), distance);
    await page.waitForFunction(() => Number(document.querySelector('section[aria-labelledby="home-title"]').style.getPropertyValue('--journey-progress')) > .99);
    assert.equal(await page.locator('video').count(), 0, 'Chosen scene must not be replaced by video');
    const expanded = await windowFrame.boundingBox();
    assert.ok(expanded.width > initial.width, 'Window expands');
    assert.ok(Math.abs(expanded.width - width) < 2, 'Expanded image fills viewport');
    await page.screenshot({ path: `outputs/audit/2026-09-23/window-expanded-${width}.png` });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('section[aria-labelledby="home-title"]').style.getPropertyValue('--journey-progress') === '0');
    assert.equal(await page.locator('video').count(), 0);
    results.push({ width, expansion: 'passed', reducedMotion: 'passed' });
    await page.close();
  }
  await writeFile('outputs/audit/2026-09-23/window-motion.json', JSON.stringify(results, null, 2));
  console.log(results);
} finally { await browser.close(); }
