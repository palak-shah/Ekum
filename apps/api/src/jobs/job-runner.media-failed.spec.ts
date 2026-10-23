import { describe, expect, it, vi } from 'vitest';
import { JobType, MediaStatus } from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';
import { markThumbnailMediaFailed } from './job-runner.service';

describe('markThumbnailMediaFailed', () => {
  it('sets Media.status to failed for an exhausted thumbnail job', async () => {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const prisma = { media: { updateMany } } as unknown as PrismaService;
    await markThumbnailMediaFailed(prisma, {
      type: JobType.MediaThumbnail,
      payload: { mediaId: 'm1' },
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { status: MediaStatus.Failed },
    });
  });

  it('ignores other job types', async () => {
    const updateMany = vi.fn(async () => ({ count: 0 }));
    const prisma = { media: { updateMany } } as unknown as PrismaService;
    await markThumbnailMediaFailed(prisma, {
      type: JobType.NotificationDigest,
      payload: { mediaId: 'm1' },
    });
    expect(updateMany).not.toHaveBeenCalled();
  });
});
