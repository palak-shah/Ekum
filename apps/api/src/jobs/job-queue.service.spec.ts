import { describe, expect, it } from 'vitest';
import { nextDailyRun } from './job-queue.service';

describe('nextDailyRun', () => {
  it('schedules later today when the hour is still ahead', () => {
    const now = new Date('2026-01-01T01:00:00.000Z');
    const next = nextDailyRun(3, now);
    expect(next.toISOString()).toBe('2026-01-01T03:00:00.000Z');
  });

  it('rolls to tomorrow when the hour has already passed', () => {
    const now = new Date('2026-01-01T05:00:00.000Z');
    const next = nextDailyRun(3, now);
    expect(next.toISOString()).toBe('2026-01-02T03:00:00.000Z');
  });

  it('rolls forward when exactly on the hour (never schedules in the past)', () => {
    const now = new Date('2026-01-01T03:00:00.000Z');
    const next = nextDailyRun(3, now);
    expect(next.getTime()).toBeGreaterThan(now.getTime());
  });
});
