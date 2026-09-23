import mongoose, { Schema } from 'mongoose';

const schema = new Schema(
  {
    competition: { type: Schema.Types.ObjectId, required: true, ref: 'Competition' },
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String, unique: true, sparse: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: {
      type: String,
      enum: ['created', 'registered', 'refund_pending', 'refunding', 'refunded'],
      default: 'created',
    },
    refundId: String,
  },
  { timestamps: true },
);
schema.index({ competition: 1, user: 1 }, { unique: true });
export const PaymentOrder = mongoose.model('PaymentOrder', schema);
