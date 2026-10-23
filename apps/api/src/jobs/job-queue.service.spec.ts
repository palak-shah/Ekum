import { describe, expect, it, vi } from 'vitest';
import { JobType } from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';
import { JobQueue, nextDailyRun } from './job-queue.service';

describe('JobQueue.ensureOnce', () => {
  it('enqueues when this type has never been queued', async () => {
    const create = vi.fn(async () => ({ id: 'j1' }));
    const prisma = {
      job: { count: vi.fn(async () => 0), create },
    } as unknown as PrismaService;
    await new JobQueue(prisma).ensureOnce(JobType.MediaThumbnailBackfill);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: JobType.MediaThumbnailBackfill }),
      }),
    );
  });

  it('does not enqueue again after a completed or failed backfill', async () => {
    const create = vi.fn(async () => ({ id: 'j1' }));
    const prisma = {
      job: { count: vi.fn(async () => 1), create },
    } as unknown as PrismaService;
    await new JobQueue(prisma).ensureOnce(JobType.MediaThumbnailBackfill);
    expect(create).not.toHaveBeenCalled();
  });
});

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
