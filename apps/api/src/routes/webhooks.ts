import { Router, raw } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../middleware/errors.js';
import { PaymentOrder } from '../models/paymentOrder.js';
import { completePayment } from '../services/payments.js';
import { validSignature } from '../services/razorpay.js';

export const webhookRouter = Router();
webhookRouter.post(
  '/razorpay',
  raw({ type: 'application/json', limit: '64kb' }),
  async (req, res) => {
    if (!env.RAZORPAY_WEBHOOK_SECRET)
      throw new ApiError(503, 'WEBHOOK_UNCONFIGURED', 'Webhook is not configured');
    if (
      !Buffer.isBuffer(req.body) ||
      !validSignature(req.body, req.get('x-razorpay-signature') ?? '', env.RAZORPAY_WEBHOOK_SECRET)
    )
      throw new ApiError(400, 'INVALID_SIGNATURE', 'Invalid webhook signature');
    const event = z
      .object({ event: z.string(), payload: z.unknown() })
      .parse(JSON.parse(req.body.toString()));
    if (event.event === 'payment.captured') {
      const payload = z
        .object({
          payment: z.object({
            entity: z.object({
              id: z.string().regex(/^pay_[a-zA-Z0-9]+$/),
              order_id: z.string().regex(/^order_[a-zA-Z0-9]+$/),
            }),
          }),
        })
        .parse(event.payload);
      const payment = payload.payment.entity;
      const order = await PaymentOrder.findOne({ orderId: payment.order_id });
      if (order && order.status === 'created') {
        try {
          await completePayment(payment.order_id, payment.id);
        } catch (error) {
          if (
            !(error instanceof ApiError) ||
            !['PAYMENT_REFUND', 'PAYMENT_REVIEW'].includes(error.code)
          )
            throw error;
        }
      }
    }
    res.json({ received: true });
  },
);
