import { describe, expect, it } from 'vitest';
import { Competition } from '../src/models/index.js';
import { competitionFixture } from '../src/scripts/fixture.js';
import { actionFor, lifecycle } from '../src/services/lifecycle.js';

describe('competition lifecycle and exact deadline boundaries', () => {
  const c = new Competition(competitionFixture()).toObject();
  it('opens registration at the opening instant', () => {
    expect(lifecycle(c, new Date(c.registrationOpensAt.getTime() - 1))).toBe('upcoming');
    expect(lifecycle(c, c.registrationOpensAt)).toBe('open');
  });
  it('closes registration at the deadline even while submissions remain open', () => {
    expect(actionFor(c, false, false, c.registrationClosesAt).type).toBe('disabled');
    expect(actionFor(c, true, false, c.registrationClosesAt).type).toBe('upload');
  });
  it('disables uploads exactly at the submission deadline', () => {
    expect(actionFor(c, true, false, new Date(c.submissionClosesAt.getTime() - 1)).type).toBe(
      'upload',
    );
    expect(actionFor(c, true, false, c.submissionClosesAt).type).toBe('disabled');
  });
  it('full competitions still permit existing participants to submit', () => {
    const full = { ...c, booked: c.capacity };
    expect(lifecycle(full)).toBe('full');
    expect(actionFor(full, false, false).type).toBe('disabled');
    expect(actionFor(full, true, false).type).toBe('upload');
  });
  it('does not claim results are published solely because a date passed', () => {
    expect(lifecycle(c, new Date(c.resultsAt.getTime() + 1))).toBe('judging');
    expect(lifecycle({ ...c, resultsPublished: true }, c.resultsAt)).toBe('completed');
  });
  it('cancelled competitions disable all actions', () => {
    const cancelled = { ...c, status: 'cancelled' as const };
    expect(lifecycle(cancelled)).toBe('cancelled');
    expect(actionFor(cancelled, true, true).type).toBe('disabled');
  });
  it('rejects incoherent date and capacity models', async () => {
    const invalid = new Competition({
      ...competitionFixture(),
      booked: 21,
      resultsAt: new Date(0),
    });
    await expect(invalid.validate()).rejects.toThrow();
  });
});
