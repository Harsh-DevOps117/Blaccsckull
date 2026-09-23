import mongoose, { Schema } from 'mongoose';

const localized = {
  en: { type: String, required: true },
  hi: { type: String, required: true },
};
const photo = { x: Number, y: Number, width: Number, height: Number };
const competitionSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: localized,
    category: localized,
    status: {
      type: String,
      enum: ['published', 'cancelled', 'draft'],
      default: 'published',
    },
    capacity: { type: Number, required: true, min: 1 },
    booked: { type: Number, default: 0, min: 0 },
    entryFee: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    registrationOpensAt: { type: Date, required: true },
    registrationClosesAt: { type: Date, required: true },
    submissionOpensAt: { type: Date, required: true },
    submissionClosesAt: { type: Date, required: true },
    resultsAt: { type: Date, required: true },
    resultsPublished: { type: Boolean, default: false },
    judge: {
      name: String,
      role: localized,
      experience: localized,
      photo,
      videoUrl: String,
    },
    about: localized,
    aboutMore: localized,
    criteria: [{ label: localized, weight: Number }],
    rules: [localized],
    rewards: [{ position: Number, amount: Number }],
    winners: [{ name: String, position: Number, photo, videoUrl: String }],
    testimonials: [{ name: String, quote: localized, rating: Number }],
    refundPolicy: localized,
    payoutInfo: localized,
    payoutVideoUrl: String,
    referralReward: { type: Number, default: 1000 },
    revision: { type: Number, default: 0 },
  },
  { timestamps: true },
);
competitionSchema.index({ status: 1, registrationClosesAt: 1 });
competitionSchema.pre('validate', function () {
  if (this.registrationOpensAt >= this.registrationClosesAt)
    this.invalidate('registrationClosesAt', 'Registration window is invalid');
  if (this.submissionOpensAt >= this.submissionClosesAt)
    this.invalidate('submissionClosesAt', 'Submission window is invalid');
  if (this.registrationClosesAt > this.submissionClosesAt)
    this.invalidate('registrationClosesAt', 'Registration must close before submissions');
  if (this.resultsAt <= this.submissionClosesAt)
    this.invalidate('resultsAt', 'Results must follow submissions');
  if (this.booked > this.capacity) this.invalidate('booked', 'Capacity exceeded');
});

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    referralCode: { type: String, required: true, unique: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const registrationSchema = new Schema(
  {
    competition: {
      type: Schema.Types.ObjectId,
      ref: 'Competition',
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    payment: {
      status: {
        type: String,
        enum: ['demo_paid', 'paid', 'free'],
        required: true,
      },
      amount: { type: Number, required: true },
      reference: { type: String, required: true },
    },
    submission: {
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      title: String,
      submittedAt: Date,
    },
  },
  { timestamps: true },
);
registrationSchema.index({ competition: 1, user: 1 }, { unique: true });
registrationSchema.index({ user: 1, createdAt: -1 });

export const Competition = mongoose.model('Competition', competitionSchema);
export const User = mongoose.model('User', userSchema);
export const Registration = mongoose.model('Registration', registrationSchema);
export type CompetitionData = mongoose.InferSchemaType<typeof competitionSchema>;
