export type Locale = 'en' | 'hi';
export type Localized = { en: string; hi: string };
export type Photo = { x: number; y: number; width: number; height: number };
export type User = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
};
export type Competition = {
  _id: string;
  slug: string;
  title: Localized;
  category: Localized;
  capacity: number;
  booked: number;
  entryFee: number;
  prizePool: number;
  spotsLeft: number;
  timezone: string;
  lifecycle: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  submissionOpensAt: string;
  submissionClosesAt: string;
  resultsAt: string;
  judge: {
    name: string;
    role: Localized;
    experience: Localized;
    photo: Photo;
    videoUrl: string;
  };
  about: Localized;
  aboutMore: Localized;
  criteria: { label: Localized; weight: number }[];
  rules: Localized[];
  rewards: { position: number; amount: number }[];
  winners: { name: string; position: number; photo: Photo; videoUrl: string }[];
  testimonials: { name: string; quote: Localized; rating: number }[];
  refundPolicy: Localized;
  payoutInfo: Localized;
  payoutVideoUrl: string;
  referralReward: number;
};
export type Details = {
  competition: Competition;
  participation: null | {
    id: string;
    status: 'registered' | 'submitted';
    payment: { status: string; amount: number; reference: string };
    submission: null | {
      title: string;
      originalName: string;
      submittedAt: string;
      size: number;
      videoUrl: string;
    };
  };
  action: { type: 'register' | 'upload' | 'disabled'; label: string };
  serverTime: string;
  paymentMode: 'demo' | 'disabled' | 'razorpay';
  paymentTestMode: boolean;
  media: { referenceUrl: string };
};
