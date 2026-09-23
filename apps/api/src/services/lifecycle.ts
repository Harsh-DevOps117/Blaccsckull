import type { CompetitionData } from '../models/index.js';

export function lifecycle(c: CompetitionData, now = new Date()) {
  if (c.status === 'cancelled') return 'cancelled';
  if (now < c.registrationOpensAt) return 'upcoming';
  if (now >= c.submissionClosesAt)
    return c.resultsPublished && now >= c.resultsAt ? 'completed' : 'judging';
  if (now < c.registrationClosesAt) return c.booked >= c.capacity ? 'full' : 'open';
  return now >= c.submissionOpensAt ? 'submission' : 'registration_closed';
}

export function actionFor(
  c: CompetitionData,
  registered: boolean,
  submitted: boolean,
  now = new Date(),
) {
  if (c.status === 'cancelled') return { type: 'disabled', label: 'Competition cancelled' };
  if (registered && now >= c.submissionOpensAt && now < c.submissionClosesAt) {
    return {
      type: 'upload',
      label: submitted ? 'Update Submission' : 'Upload Submission',
    };
  }
  if (registered && now < c.submissionOpensAt)
    return { type: 'disabled', label: 'Submission opens soon' };
  if (registered && submitted)
    return {
      type: 'disabled',
      label: c.resultsPublished && now >= c.resultsAt ? 'Results announced' : 'Submission received',
    };
  const state = lifecycle(c, now);
  return state === 'open'
    ? { type: 'register', label: 'Register Now' }
    : {
        type: 'disabled',
        label: (
          {
            upcoming: 'Registration opens soon',
            full: 'All spots booked',
            judging: 'Judging in progress',
            completed: 'Competition ended',
            submission: 'Registration closed',
            registration_closed: 'Registration closed',
            cancelled: 'Competition cancelled',
          } as Record<string, string>
        )[state],
      };
}
