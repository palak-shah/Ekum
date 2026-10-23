import { describe, expect, it, vi } from 'vitest';
import { JobType } from '@ekum/domain-types';
import type { PrismaService } from '../../core/prisma/prisma.service';
import type { JobQueue } from '../job-queue.service';
import { MediaThumbnailBackfillHandler } from './media-thumbnail-backfill.handler';

describe('MediaThumbnailBackfillHandler', () => {
  it('enqueues a thumbnail job per page and reschedules when the page is full', async () => {
    const ids = Array.from({ length: 20 }, (_, i) => ({ id: `m${String(i).padStart(2, '0')}` }));
    const prisma = {
      media: {
        findMany: async () => ids,
      },
    } as unknown as PrismaService;
    const enqueue = vi.fn(async () => 'job');
    const queue = { enqueue } as unknown as JobQueue;
    await new MediaThumbnailBackfillHandler(prisma, queue).run({});
    expect(enqueue).toHaveBeenCalledTimes(21);
    expect(enqueue).toHaveBeenCalledWith(JobType.MediaThumbnail, { mediaId: 'm00' });
    expect(enqueue).toHaveBeenCalledWith(JobType.MediaThumbnailBackfill, { cursor: 'm19' });
  });

  it('stops when a short page remains', async () => {
    const prisma = {
      media: {
        findMany: async () => [{ id: 'm1' }],
      },
    } as unknown as PrismaService;
    const enqueue = vi.fn(async () => 'job');
    const queue = { enqueue } as unknown as JobQueue;
    await new MediaThumbnailBackfillHandler(prisma, queue).run({ cursor: 'm0' });
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith(JobType.MediaThumbnail, { mediaId: 'm1' });
  });
});
