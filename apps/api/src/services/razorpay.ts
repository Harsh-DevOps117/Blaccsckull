import { createHmac, timingSafeEqual } from 'node:crypto';
import { env, paymentMode } from '../config/env.js';
import { ApiError } from '../middleware/errors.js';

export type ProviderPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  amount_refunded: number;
};
export async function razorpayRequest<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  if (paymentMode() !== 'razorpay')
    throw new ApiError(409, 'PAYMENTS_UNAVAILABLE', 'Razorpay is not configured');
  try {
    const response = await fetch(`https://api.razorpay.com/v1${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new ApiError(
        502,
        'PAYMENT_PROVIDER_ERROR',
        'Razorpay could not complete this request. Please retry; simulated checkout is only available when keys are missing.',
      );
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      502,
      'PAYMENT_PROVIDER_UNAVAILABLE',
      'Unable to reach Razorpay. Please retry to check your payment before paying again.',
    );
  }
}

export function validSignature(value: string | Buffer, signature: string, secret: string) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(value).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}
