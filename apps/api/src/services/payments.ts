import { randomUUID } from 'node:crypto';
import { env, paymentMode } from '../config/env.js';
import { ApiError } from '../middleware/errors.js';
import { Competition, Registration, User } from '../models/index.js';
import { PaymentOrder } from '../models/paymentOrder.js';
import { registerForCompetition } from './registration.js';
import { razorpayRequest, validSignature, type ProviderPayment } from './razorpay.js';

export async function createCheckout(slug: string, userId: string) {
  if (paymentMode() !== 'razorpay')
    throw new ApiError(409, 'PAYMENTS_UNAVAILABLE', 'Razorpay is not configured');
  const c = await Competition.findOne({ slug, status: { $ne: 'draft' } });
  if (!c) throw new ApiError(404, 'NOT_FOUND', 'Competition not found');
  if (await Registration.exists({ competition: c._id, user: userId }))
    return { registered: true as const };
  const user = await User.findById(userId);
  if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'Account not found');
  let order = await PaymentOrder.findOne({ competition: c._id, user: userId });
  if (order) {
    if (order.status !== 'created')
      throw new ApiError(
        409,
        'PAYMENT_REVIEW',
        `Payment refund status: ${order.status}. Reference: ${order.orderId}.`,
      );
    const payments = await razorpayRequest<{ items: ProviderPayment[] }>(
      `/orders/${order.orderId}/payments`,
    );
    const paid = payments.items.find((p) => p.status === 'captured' || p.status === 'authorized');
    if (paid) {
      await completePayment(order.orderId, paid.id);
      return { registered: true as const };
    }
  }
  const now = new Date();
  if (c.status !== 'published' || now < c.registrationOpensAt || now >= c.registrationClosesAt)
    throw new ApiError(409, 'REGISTRATION_CLOSED', 'Registration is not open');
  if (c.booked >= c.capacity)
    throw new ApiError(409, 'COMPETITION_FULL', 'All spots have been booked');
  if (!c.entryFee)
    throw new ApiError(400, 'FREE_COMPETITION', 'Use free registration for this competition');
  if (order && (order.amount !== c.entryFee || order.currency !== c.currency))
    throw new ApiError(
      409,
      'PRICE_CHANGED',
      'The entry fee changed. Please contact support before paying.',
    );
  if (!order) {
    const providerOrder = await razorpayRequest<{ id: string; amount: number; currency: string }>(
      '/orders',
      {
        amount: c.entryFee,
        currency: c.currency,
        receipt: randomUUID(),
        notes: { competition: c.id, user: userId },
      },
    );
    if (
      !/^order_[a-zA-Z0-9]+$/.test(providerOrder.id) ||
      providerOrder.amount !== c.entryFee ||
      providerOrder.currency !== c.currency
    )
      throw new ApiError(502, 'INVALID_ORDER', 'Razorpay returned an invalid order');
    try {
      order = await PaymentOrder.create({
        competition: c._id,
        user: userId,
        orderId: providerOrder.id,
        amount: c.entryFee,
        currency: c.currency,
      });
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      order = await PaymentOrder.findOne({ competition: c._id, user: userId });
      if (!order) throw error;
    }
  }
  return {
    registered: false as const,
    keyId: env.RAZORPAY_KEY_ID,
    orderId: order.orderId,
    amount: order.amount,
    currency: order.currency,
    name: 'Feedants',
    description: c.title?.en ?? c.slug,
    prefill: { name: user.name, email: user.email },
  };
}

export async function verifyCheckout(
  slug: string,
  userId: string,
  data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
) {
  const c = await Competition.findOne({ slug });
  const order = c
    ? await PaymentOrder.findOne({
        orderId: data.razorpay_order_id,
        competition: c._id,
        user: userId,
      })
    : null;
  if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Payment order not found');
  if (
    !validSignature(
      `${order.orderId}|${data.razorpay_payment_id}`,
      data.razorpay_signature,
      env.RAZORPAY_KEY_SECRET,
    )
  )
    throw new ApiError(400, 'INVALID_SIGNATURE', 'Payment verification failed');
  return completePayment(order.orderId, data.razorpay_payment_id);
}

export async function completePayment(orderId: string, paymentId: string) {
  const order = await PaymentOrder.findOne({ orderId });
  if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Payment order not found');
  if (order.paymentId && order.paymentId !== paymentId)
    throw new ApiError(409, 'PAYMENT_MISMATCH', 'This order already has a different payment');
  if (order.status === 'registered') return { registered: true };
  if (order.status !== 'created')
    throw new ApiError(
      409,
      'PAYMENT_REVIEW',
      `Registration could not be completed. Refund status: ${order.status}. Reference: ${order.orderId}.`,
    );
  let payment = await razorpayRequest<ProviderPayment>(`/payments/${paymentId}`);
  const matches = () =>
    payment.id === paymentId &&
    payment.order_id === order.orderId &&
    payment.amount === order.amount &&
    payment.currency === order.currency &&
    !payment.amount_refunded;
  if (!matches())
    throw new ApiError(
      400,
      'PAYMENT_MISMATCH',
      'Payment does not match the order amount and currency',
    );
  if (payment.status === 'authorized') {
    try {
      payment = await razorpayRequest<ProviderPayment>(`/payments/${paymentId}/capture`, {
        amount: order.amount,
        currency: order.currency,
      });
    } catch {
      payment = await razorpayRequest<ProviderPayment>(`/payments/${paymentId}`);
    }
  }
  if (!matches() || payment.status !== 'captured')
    throw new ApiError(
      409,
      'PAYMENT_PENDING',
      'Payment is not captured yet. Retry registration to check its status; do not pay again.',
    );
  const c = await Competition.findById(order.competition);
  try {
    if (!c) throw new ApiError(409, 'REGISTRATION_CLOSED', 'Competition is unavailable');
    await registerForCompetition(c.slug, order.user.toString(), false, { orderId, paymentId });
    return { registered: true };
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      !['REGISTRATION_CLOSED', 'COMPETITION_FULL', 'PRICE_CHANGED'].includes(error.code)
    )
      throw error;
    const claimed = await PaymentOrder.findOneAndUpdate(
      { _id: order._id, status: 'created' },
      { status: 'refunding', paymentId },
      { new: true },
    );
    if (claimed) {
      try {
        const refund = await razorpayRequest<{ id: string }>(`/payments/${paymentId}/refund`, {
          amount: order.amount,
          notes: { reason: 'Competition no longer available', order: orderId },
        });
        await PaymentOrder.updateOne(
          { _id: order._id, status: 'refunding' },
          { status: 'refunded', refundId: refund.id },
        );
      } catch {
        await PaymentOrder.updateOne(
          { _id: order._id, status: 'refunding' },
          { status: 'refund_pending' },
        );
      }
    }
    const current = await PaymentOrder.findById(order._id);
    throw new ApiError(
      409,
      'PAYMENT_REFUND',
      `The competition became unavailable during checkout. ${current?.status === 'refunded' ? 'A full refund has been requested successfully.' : 'Your payment is recorded for refund review; contact support.'} Reference: ${orderId}.`,
    );
  }
}
