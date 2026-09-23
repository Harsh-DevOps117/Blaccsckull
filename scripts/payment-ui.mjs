import { chromium, expect } from '@playwright/test';
import { competitionFixture } from '../apps/api/src/scripts/fixture.ts';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
let mode = 'demo';
let registered = false;
let verified = 0;
let simulated = 0;
let failProvider = false;
const c = {
  ...competitionFixture(),
  _id: '000000000000000000000001',
  prizePool: 150000,
  spotsLeft: 20,
  lifecycle: 'open',
  timezone: 'Asia/Kolkata',
};
const user = {
  id: '000000000000000000000002',
  name: 'Payment UI Tester',
  email: 'ui@example.com',
  referralCode: '000000000001',
};
await page.addInitScript(() => localStorage.setItem('feedants.token', 'isolated-ui-fixture'));
await page.route('**/api/**', async (route) => {
  const url = route.request().url();
  let body;
  let status = 200;
  if (url.endsWith('/auth/me'))
    body = { user, referralLink: 'http://localhost:8081/?ref=000000000001', referralCount: 0 };
  else if (url.endsWith('/payments/order')) {
    if (failProvider) {
      status = 502;
      body = { error: { message: 'Razorpay is unavailable. Please retry.' } };
    } else
      body = {
        registered: false,
        keyId: 'rzp_test_ui',
        orderId: 'order_Test',
        amount: 9900,
        currency: 'INR',
        name: 'Feedants',
        description: c.title.en,
        prefill: { name: user.name, email: user.email },
      };
  } else if (url.endsWith('/payments/verify')) {
    const input = route.request().postDataJSON();
    expect(input.razorpay_order_id).toBe('order_Test');
    expect(input.razorpay_payment_id).toBe('pay_Test');
    verified++;
    registered = true;
    body = { registered: true };
  } else if (url.endsWith('/register')) {
    simulated++;
    registered = true;
    body = { created: true };
  } else
    body = {
      competition: c,
      participation: registered
        ? { id: 'registration', status: 'registered', submission: null }
        : null,
      action: {
        type: registered ? 'upload' : 'register',
        label: registered ? 'Upload Submission' : 'Register Now',
      },
      serverTime: new Date().toISOString(),
      paymentMode: mode,
      paymentTestMode: true,
      media: { referenceUrl: '' },
    };
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
});
await page.route('https://checkout.razorpay.com/v1/checkout.js', (route) =>
  route.fulfill({
    contentType: 'application/javascript',
    body: `window.Razorpay = class {
  constructor(options) { this.options = options; }
  on() {}
  close() {}
  open() {
    if (window.cancelTestCheckout) this.options.modal.ondismiss();
    else this.options.handler({ razorpay_order_id: 'order_Test', razorpay_payment_id: 'pay_Test', razorpay_signature: 'a'.repeat(64) });
  }
};`,
  }),
);
try {
  await page.goto('http://localhost:8081');
  await page.getByRole('button', { name: 'Register Now · ₹ 99', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm demo registration', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Upload Submission', exact: true })).toBeVisible();
  expect(simulated).toBe(1);
  mode = 'razorpay';
  registered = false;
  await page.reload();
  await page.getByRole('button', { name: 'Register Now · ₹ 99', exact: true }).click();
  await expect(page.getByText(/Razorpay test checkout/)).toBeVisible();
  await page.getByRole('button', { name: 'Pay ₹ 99 with Razorpay', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Upload Submission', exact: true })).toBeVisible();
  expect(verified).toBe(1);
  registered = false;
  await page.reload();
  await page.evaluate(() => {
    window.cancelTestCheckout = true;
  });
  await page.getByRole('button', { name: 'Register Now · ₹ 99', exact: true }).click();
  await page.getByRole('button', { name: 'Pay ₹ 99 with Razorpay', exact: true }).click();
  await expect(
    page.getByText('Payment cancelled. Your registration has not been confirmed.'),
  ).toBeVisible();
  expect(verified).toBe(1);
  failProvider = true;
  await page.getByRole('button', { name: 'Pay ₹ 99 with Razorpay', exact: true }).click();
  await expect(page.getByText('Razorpay is unavailable. Please retry.')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Confirm demo registration', exact: true }),
  ).toHaveCount(0);
  expect(simulated).toBe(1);
  expect(errors).toEqual([]);
  console.log(
    'Mocked browser payment checks passed: simulated fallback, Razorpay callback, cancellation, provider failure without fallback.',
  );
} finally {
  await browser.close();
}
