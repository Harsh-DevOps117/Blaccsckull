import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { paymentMode } from '../config/env.js';
import { ApiError } from '../middleware/errors.js';
import { Competition, Registration, User } from '../models/index.js';

export async function registerForCompetition(
  slug: string,
  userId: string,
  acceptDemoPayment: boolean,
) {
  try {
    return await mongoose.connection.transaction(async (session) => {
      const now = new Date();
      const competition = await Competition.findOne({ slug, status: { $ne: 'draft' } }).session(
        session,
      );
      if (!competition) throw new ApiError(404, 'NOT_FOUND', 'Competition not found');
      const existing = await Registration.findOne({
        competition: competition._id,
        user: userId,
      }).session(session);
      if (existing) return { registration: existing, created: false };
      if (!(await User.exists({ _id: userId }).session(session)))
        throw new ApiError(401, 'UNAUTHORIZED', 'Account not found');
      if (
        competition.status !== 'published' ||
        now < competition.registrationOpensAt ||
        now >= competition.registrationClosesAt
      )
        throw new ApiError(409, 'REGISTRATION_CLOSED', 'Registration is not open');
      if (competition.entryFee > 0 && (paymentMode() !== 'demo' || !acceptDemoPayment))
        throw new ApiError(
          409,
          'PAYMENT_REQUIRED',
          'Confirm the simulated payment to register. No real money is charged.',
        );
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
              status: competition.entryFee ? 'demo_paid' : 'free',
              amount: competition.entryFee,
              reference: randomUUID(),
            },
          },
        ],
        { session },
      );
      return { registration, created: true };
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      const competition = await Competition.findOne({ slug });
      const registration = await Registration.findOne({
        competition: competition?._id,
        user: userId,
      });
      if (registration) return { registration, created: false };
    }
    throw error;
  }
}
