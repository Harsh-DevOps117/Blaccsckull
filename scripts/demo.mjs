import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const details = await (
  await fetch('http://localhost:4000/api/competitions/feedants-classical-dance')
).json();
if (details.paymentMode !== 'demo')
  throw new Error(
    'This recording script requires simulated fallback. Clear the Razorpay keys and restart the API to record it.',
  );
await mkdir('docs/recordings', { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 430, height: 932 },
  recordVideo: { dir: 'docs/recordings', size: { width: 430, height: 932 } },
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const pause = () => page.waitForTimeout(1300);
const close = () => page.getByRole('button', { name: 'Close dialog', exact: true }).last().click();
try {
  await page.goto('http://localhost:8081');
  await expect(page.getByText('Feedants Classical Dance', { exact: true })).toBeVisible({
    timeout: 60000,
  });
  await pause();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByLabel('Email address', { exact: true }).fill('demo@feedants.com');
  await page
    .getByLabel('Password', { exact: true })
    .fill(process.env.SEED_DEMO_PASSWORD ?? 'FeedantsDemo2026!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Upload Submission', exact: true })).toBeVisible();
  await pause();
  await page.setViewportSize({ width: 853, height: 1844 });
  await page.screenshot({ path: 'docs/screen-desktop.png' });
  await page.setViewportSize({ width: 430, height: 932 });
  await page.screenshot({ path: 'docs/screen-mobile.png' });
  await page.getByRole('button', { name: 'हिंदी', exact: true }).click();
  await expect(page.getByText('फीडैंट्स शास्त्रीय नृत्य', { exact: true })).toBeVisible();
  await pause();
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.getByRole('tab', { name: 'Judging Parameters', exact: true }).click();
  await expect(page.getByText('Technique & precision', { exact: true })).toBeVisible();
  await pause();
  await page.getByRole('tab', { name: 'Rules & Eligibility', exact: true }).click();
  await pause();
  await page.getByRole('tab', { name: 'About Competition', exact: true }).click();
  await page.getByRole('button', { name: 'View more', exact: false }).click();
  await pause();
  await page.getByText('Refund policy', { exact: true }).click();
  await expect(page.getByText(/Entry fees are refundable/)).toBeVisible();
  await pause();
  await close();
  await page.getByText('Hear From Our Users', { exact: true }).click();
  await pause();
  await close();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByRole('button', { name: 'Register Now · ₹ 99', exact: true }).click();
  await page.getByText('New to Feedants? Create an account', { exact: true }).click();
  await page.getByLabel('Full name', { exact: true }).fill('Demo Dancer');
  await page.getByLabel('Email address', { exact: true }).fill(`demo.${Date.now()}@example.com`);
  await page.getByLabel('Password', { exact: true }).fill('DemoDancer2026!');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Register Now · ₹ 99', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Register Now · ₹ 99', exact: true }).click();
  await pause();
  await page.getByRole('button', { name: 'Confirm demo registration', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Upload Submission', exact: true })).toBeVisible();
  await pause();
  await page.getByRole('button', { name: 'Upload Submission', exact: true }).click();
  await page
    .getByLabel('Performance title', { exact: true })
    .fill('My classical dance performance');
  const picker = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose video', exact: true }).click();
  await (await picker).setFiles('docs/demo-performance.mp4');
  await pause();
  await page.getByRole('button', { name: 'Submit performance', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Update Submission', exact: true })).toBeVisible({
    timeout: 30000,
  });
  await pause();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Update Submission', exact: true })).toBeVisible({
    timeout: 30000,
  });
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'View my submission', exact: true }).click();
  await expect(page.locator('video')).toBeVisible();
  await page.waitForFunction(() => {
    const video = document.querySelector('video');
    return video && video.readyState >= 2;
  });
  await pause();
  await close();
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  await expect(page.getByText('Find your next stage', { exact: true })).toBeVisible();
  await pause();
  await close();
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(
    'Browser checks passed: authentication, locale, tabs, policies, signup, registration, upload, persistence, private playback, navigation.',
  );
} catch (error) {
  await page.screenshot({ path: 'docs/browser-failure.png' });
  console.error((await page.locator('body').innerText()).slice(-6000));
  throw error;
} finally {
  const video = page.video();
  await context.close();
  if (video) await video.saveAs('docs/demo.webm');
  await browser.close();
}
