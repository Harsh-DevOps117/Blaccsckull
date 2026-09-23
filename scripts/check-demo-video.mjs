import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
try {
  await page.goto('http://localhost:8081');
  await page.getByRole('button', { name: 'Intro Video', exact: true }).click();
  await expect(page.locator('video')).toBeVisible();
  await page.locator('video').evaluate((video) => {
    video.muted = true;
    return video.play();
  });
  await page.waitForFunction(
    () => {
      const video = document.querySelector('video');
      return video && video.readyState >= 2 && video.currentTime > 0;
    },
    { timeout: 20000 },
  );
  expect(await page.locator('video').evaluate((video) => video.currentSrc)).toContain(
    '/media/demo-performance.mp4',
  );
  await expect(
    page.getByText('This video is unavailable. Please check your connection and try again.'),
  ).toHaveCount(0);
  await expect(page.getByText(/Demo preview video. Replace/)).toHaveCount(0);
  const response = await page.request.get(
    'http://localhost:4000/api/competitions/feedants-classical-dance',
  );
  const data = await response.json();
  expect(data.competition.payoutVideoUrl).toContain('/media/demo-performance.mp4');
  expect(
    data.competition.winners.every((winner) =>
      winner.videoUrl.endsWith('/media/demo-performance.mp4'),
    ),
  ).toBe(true);
  console.log('Demo preview playback passed. Judge, winner and payout URLs use the local MP4.');
} catch (error) {
  console.log(
    await page.locator('video').evaluate((video) => ({
      src: video.currentSrc,
      ready: video.readyState,
      paused: video.paused,
      time: video.currentTime,
      error: video.error?.message,
    })),
  );
  throw error;
} finally {
  await browser.close();
}
