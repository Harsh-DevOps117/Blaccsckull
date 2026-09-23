import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 853, height: 1844 },
    deviceScaleFactor: 1,
  });
  page.on('pageerror', (e) => console.error('PAGE_ERROR', e.message));
  await page.goto('http://localhost:8081');
  await page.getByText('Feedants Classical Dance', { exact: true }).waitFor({ timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'docs/screen-desktop.png', fullPage: true });
  console.log((await page.locator('body').innerText()).slice(0, 2000));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'docs/screen-mobile.png' });
} finally {
  await browser.close();
}
