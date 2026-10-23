import { describe, expect, it, vi } from 'vitest';
import { JobType } from '@ekum/domain-types';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '../core/config/config.schema';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { JobQueue } from './job-queue.service';
import type { JobHandler } from './job.types';
import { JobRunner } from './job-runner.service';

describe('JobRunner thumbnail batch', () => {
  it('runs Sharp jobs one at a time so a multi-upload does not pile CPU on the request', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const handler: JobHandler = {
      type: JobType.MediaThumbnail,
      run: async () => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 8));
        inFlight -= 1;
      },
    };
    const claimed = ['m1', 'm2', 'm3'].map((id) => ({
      id: `j-${id}`,
      type: JobType.MediaThumbnail,
      payload: { mediaId: id },
      attempts: 1,
      maxAttempts: 5,
    }));
    const update = vi.fn(async () => undefined);
    const prisma = {
      $queryRaw: async () => claimed,
      job: { update },
    } as unknown as PrismaService;
    const runner = new JobRunner(
      prisma,
      {} as JobQueue,
      {} as ConfigService<Env, true>,
      [handler],
    );
    await runner.tick();
    expect(maxInFlight).toBe(1);
    expect(update).toHaveBeenCalledTimes(3);
  });
});
