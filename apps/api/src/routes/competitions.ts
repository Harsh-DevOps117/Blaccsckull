import { validateVideo } from '../services/video.js';
import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileTypeFromFile } from 'file-type';
import { Competition, Registration } from '../models/index.js';
import { lifecycle, actionFor } from '../services/lifecycle.js';
import { registerForCompetition } from '../services/registration.js';
import { requireAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/errors.js';
import { env, paymentMode } from '../config/env.js';
import { createCheckout, verifyCheckout } from '../services/payments.js';

export const competitionRouter = Router();
const publicMediaUrl = (url?: string | null) =>
  url?.startsWith('/') ? `${env.PUBLIC_API_URL.replace(/\/$/, '')}${url}` : url;
const uploadDirectory = path.resolve('uploads');
await mkdir(uploadDirectory, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, _file, cb) => cb(null, randomUUID()),
  }),
  limits: { fileSize: 50 * 1024 * 1024, files: 1, fields: 1, fieldSize: 500 },
  fileFilter: (_req, file, cb) => {
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.mimetype))
      return cb(new ApiError(400, 'INVALID_VIDEO', 'Choose an MP4, MOV, or WebM video'));
    cb(null, true);
  },
});
const slugParam = z.string().regex(/^[a-z0-9-]{1,100}$/);

competitionRouter.get('/', async (_req, res) => {
  const competitions = await Competition.find({ status: 'published' })
    .select(
      'slug title category entryFee rewards capacity booked registrationOpensAt registrationClosesAt submissionOpensAt submissionClosesAt resultsAt resultsPublished status',
    )
    .sort({ registrationClosesAt: -1 })
    .limit(30)
    .lean();
  res.json({ competitions: competitions.map((c) => ({ ...c, lifecycle: lifecycle(c as never) })) });
});

competitionRouter.get('/:slug', async (req, res) => {
  const slug = slugParam.parse(req.params.slug);
  const competition = await Competition.findOne({ slug, status: { $ne: 'draft' } }).lean();
  if (!competition) throw new ApiError(404, 'NOT_FOUND', 'Competition not found');
  const registration = req.userId
    ? await Registration.findOne({ competition: competition._id, user: req.userId }).lean()
    : null;
  const now = new Date();
  const submission = registration?.submission?.filename
    ? {
        title: registration.submission.title,
        originalName: registration.submission.originalName,
        submittedAt: registration.submission.submittedAt,
        size: registration.submission.size,
        videoUrl: `${env.PUBLIC_API_URL}/api/competitions/${slug}/submission`,
      }
    : null;
  res.set('Cache-Control', 'private, no-store').json({
    competition: {
      ...competition,
      judge: { ...competition.judge, videoUrl: publicMediaUrl(competition.judge?.videoUrl) },
      winners: competition.winners.map((winner) => ({
        ...winner,
        videoUrl: publicMediaUrl(winner.videoUrl),
      })),
      payoutVideoUrl: publicMediaUrl(competition.payoutVideoUrl),
      prizePool: competition.rewards.reduce((sum, reward) => sum + (reward.amount ?? 0), 0),
      spotsLeft: Math.max(0, competition.capacity - competition.booked),
      lifecycle: lifecycle(competition, now),
    },
    participation: registration
      ? {
          id: registration._id,
          status: submission ? 'submitted' : 'registered',
          payment: registration.payment,
          submission,
        }
      : null,
    action: actionFor(competition, !!registration, !!submission, now),
    serverTime: now.toISOString(),
    paymentMode: paymentMode(),
    paymentTestMode: env.RAZORPAY_KEY_ID.startsWith('rzp_test_'),
    media: { referenceUrl: `${env.PUBLIC_API_URL}/media/reference.png` },
  });
});

competitionRouter.post('/:slug/payments/order', requireAuth, async (req, res) => {
  res.json(await createCheckout(slugParam.parse(req.params.slug), req.userId!));
});

competitionRouter.post('/:slug/payments/verify', requireAuth, async (req, res) => {
  const data = z
    .object({
      razorpay_order_id: z.string().regex(/^order_[a-zA-Z0-9]+$/),
      razorpay_payment_id: z.string().regex(/^pay_[a-zA-Z0-9]+$/),
      razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
    })
    .strict()
    .parse(req.body);
  res.json(await verifyCheckout(slugParam.parse(req.params.slug), req.userId!, data));
});

competitionRouter.post('/:slug/register', requireAuth, async (req, res) => {
  const slug = slugParam.parse(req.params.slug);
  const data = z
    .object({ acceptDemoPayment: z.boolean().default(false) })
    .strict()
    .parse(req.body);
  const result = await registerForCompetition(slug, req.userId!, data.acceptDemoPayment);
  res
    .status(result!.created ? 201 : 200)
    .json({ registrationId: result!.registration.id, created: result!.created });
});

competitionRouter.post(
  '/:slug/submission',
  requireAuth,
  async (req, _res, next) => {
    const competition = await Competition.findOne({ slug: slugParam.parse(req.params.slug) });
    if (!competition) throw new ApiError(404, 'NOT_FOUND', 'Competition not found');
    if (!(await Registration.exists({ competition: competition._id, user: req.userId })))
      throw new ApiError(403, 'NOT_REGISTERED', 'Register before uploading a submission');
    const now = new Date();
    if (
      competition.status !== 'published' ||
      now < competition.submissionOpensAt ||
      now >= competition.submissionClosesAt
    )
      throw new ApiError(409, 'SUBMISSION_CLOSED', 'Submissions are not open');
    next();
  },
  upload.single('video'),
  async (req, res) => {
    const file = req.file;
    if (!file) throw new ApiError(400, 'VIDEO_REQUIRED', 'Please choose a video');
    let oldFilename: string | undefined;
    try {
      const { title } = z.object({ title: z.string().trim().min(3).max(120) }).parse(req.body);
      const type = await fileTypeFromFile(file.path);
      if (!type || !['video/mp4', 'video/webm', 'video/quicktime'].includes(type.mime))
        throw new ApiError(400, 'INVALID_VIDEO', 'The file content is not a supported video');
      await validateVideo(file.path);
      await mongoose.connection.transaction(async (session) => {
        const now = new Date();
        const competition = await Competition.findOneAndUpdate(
          {
            slug: req.params.slug,
            status: 'published',
            submissionOpensAt: { $lte: now },
            submissionClosesAt: { $gt: now },
          },
          { $inc: { revision: 1 } },
          { session },
        );
        if (!competition)
          throw new ApiError(409, 'SUBMISSION_CLOSED', 'The submission window has closed');
        const registration = await Registration.findOne({
          competition: competition._id,
          user: req.userId,
        }).session(session);
        if (!registration) throw new ApiError(403, 'NOT_REGISTERED', 'Register before submitting');
        oldFilename = registration.submission?.filename ?? undefined;
        registration.submission = {
          filename: file.filename,
          originalName: path.basename(file.originalname).slice(0, 200),
          mimeType: type.mime,
          size: file.size,
          title,
          submittedAt: now,
        };
        await registration.save({ session });
      });
    } catch (error) {
      await unlink(file.path).catch(() => {});
      throw error;
    }
    if (oldFilename) await unlink(path.join(uploadDirectory, oldFilename)).catch(() => {});
    res.status(201).json({ message: 'Submission received' });
  },
);

competitionRouter.get('/:slug/submission', requireAuth, async (req, res) => {
  const competition = await Competition.findOne({ slug: slugParam.parse(req.params.slug) });
  const registration = competition
    ? await Registration.findOne({ competition: competition._id, user: req.userId })
    : null;
  if (!registration?.submission?.filename)
    throw new ApiError(404, 'NOT_FOUND', 'Submission not found');
  res.type(registration.submission.mimeType!).set('Cache-Control', 'private, no-store');
  res.sendFile(registration.submission.filename, { root: uploadDirectory });
});
