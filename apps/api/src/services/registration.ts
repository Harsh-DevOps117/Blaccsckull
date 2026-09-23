import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { paymentMode } from '../config/env.js';
import { PaymentOrder } from '../models/paymentOrder.js';
import { ApiError } from '../middleware/errors.js';
import { Competition, Registration, User } from '../models/index.js';

export async function registerForCompetition(
  slug: string,
  userId: string,
  acceptDemoPayment: boolean,
  verifiedPayment?: { orderId: string; paymentId: string },
) {
  try {
    return await mongoose.connection.transaction(async (session) => {
      const now = new Date();
      const competition = await Competition.findOne({
        slug,
        status: { $ne: 'draft' },
      }).session(session);
      if (!competition) throw new ApiError(404, 'NOT_FOUND', 'Competition not found');
      const existing = await Registration.findOne({
        competition: competition._id,
        user: userId,
      }).session(session);
      if (existing) {
        if (verifiedPayment && existing.payment?.reference !== verifiedPayment.paymentId)
          throw new ApiError(
            409,
            'PRICE_CHANGED',
            'An existing registration already covers this participant',
          );
        return { registration: existing, created: false };
      }
      const order = verifiedPayment
        ? await PaymentOrder.findOne({
            orderId: verifiedPayment.orderId,
            competition: competition._id,
            user: userId,
            status: 'created',
          }).session(session)
        : null;
      if (verifiedPayment && !order)
        throw new ApiError(
          409,
          'PAYMENT_REVIEW',
          'Payment order is not available for registration',
        );
      if (
        order &&
        (order.amount !== competition.entryFee || order.currency !== competition.currency)
      )
        throw new ApiError(409, 'PRICE_CHANGED', 'Entry fee changed during checkout');
      if (!(await User.exists({ _id: userId }).session(session)))
        throw new ApiError(401, 'UNAUTHORIZED', 'Account not found');
      if (
        competition.status !== 'published' ||
        now < competition.registrationOpensAt ||
        now >= competition.registrationClosesAt
      ) {
        throw new ApiError(409, 'REGISTRATION_CLOSED', 'Registration is not open');
      }
      if (
        competition.entryFee > 0 &&
        !verifiedPayment &&
        (paymentMode() !== 'demo' || !acceptDemoPayment)
      ) {
        throw new ApiError(
          409,
          'PAYMENT_REQUIRED',
          paymentMode() === 'razorpay'
            ? 'Complete Razorpay checkout to register.'
            : 'Confirm the demo payment to register. No real money is charged.',
        );
      }
      const reserved = await Competition.findOneAndUpdate(
        {
          _id: competition._id,
          status: 'published',
          registrationClosesAt: { $gt: now },
          $expr: { $lt: ['$booked', '$capacity'] },
        },
        { $inc: { booked: 1 } },
        { session, new: true },
      );
      if (!reserved)
        throw new ApiError(
          409,
          'COMPETITION_FULL',
          'The last spot was just booked. This competition is full.',
        );
      const [registration] = await Registration.create(
        [
          {
            competition: competition._id,
            user: userId,
            payment: {
              status: verifiedPayment ? 'paid' : competition.entryFee ? 'demo_paid' : 'free',
              amount: competition.entryFee,
              reference: verifiedPayment?.paymentId ?? randomUUID(),
            },
          },
        ],
        { session },
      );
      if (order && verifiedPayment) {
        order.status = 'registered';
        order.paymentId = verifiedPayment.paymentId;
        await order.save({ session });
      }
      return { registration, created: true };
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      const competition = await Competition.findOne({ slug });
      const registration = await Registration.findOne({
        competition: competition?._id,
        user: userId,
      });
      if (
        registration &&
        (!verifiedPayment || registration.payment?.reference === verifiedPayment.paymentId)
      )
        return { registration, created: false };
    }
    throw err;
  }
}
