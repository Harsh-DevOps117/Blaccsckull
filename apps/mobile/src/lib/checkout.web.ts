import { checkoutOptions, type CheckoutOrder, type CheckoutResult } from './checkout.types';

type CheckoutInstance = {
  open(): void;
  close(): void;
  on(event: string, callback: () => void): void;
};
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => CheckoutInstance;
  }
}
let loading: Promise<void> | undefined;
async function loadCheckout() {
  if (window.Razorpay) return;
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      const fail = () => {
        clearTimeout(timeout);
        script.remove();
        reject(new Error('Unable to load Razorpay. Check your connection and retry.'));
      };
      const timeout = setTimeout(fail, 15000);
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        clearTimeout(timeout);
        if (window.Razorpay) resolve();
        else fail();
      };
      script.onerror = fail;
      document.head.appendChild(script);
    }).catch((error) => {
      loading = undefined;
      throw error;
    });
  }
  await loading;
}
export async function openCheckout(order: CheckoutOrder): Promise<CheckoutResult> {
  await loadCheckout();
  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay!({
      ...checkoutOptions(order),
      handler: resolve,
      modal: {
        ondismiss: () =>
          reject(new Error('Payment cancelled. Your registration has not been confirmed.')),
      },
    });
    checkout.on('payment.failed', () => {
      reject(new Error('Payment failed. Retry registration to check its status.'));
      checkout.close();
    });
    checkout.open();
  });
}
