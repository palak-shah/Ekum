import { Injectable, Logger } from '@nestjs/common';
import { JobType, MediaKind } from '@ekum/domain-types';
import { PrismaService } from '../../core/prisma/prisma.service';
import { JobQueue } from '../job-queue.service';
import type { JobHandler } from '../job.types';

const PAGE = 20;

/**
 * Pages image Media rows and enqueues media.thumbnail for each. Idempotent: the
 * thumbnail handler no-ops when both variant blobs exist. Reschedules itself
 * with a cursor until the table is exhausted.
 */
@Injectable()
export class MediaThumbnailBackfillHandler implements JobHandler {
  readonly type = JobType.MediaThumbnailBackfill;
  private readonly logger = new Logger(MediaThumbnailBackfillHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: JobQueue,
  ) {}

  async run(payload: Record<string, unknown>): Promise<void> {
    const cursor = typeof payload.cursor === 'string' ? payload.cursor : null;
    const rows = await this.prisma.media.findMany({
      where: {
        kind: MediaKind.Image,
        ...(cursor ? { id: { gt: cursor } } : {}),
      },
      orderBy: { id: 'asc' },
      take: PAGE,
      select: { id: true },
    });
    for (const row of rows) {
      await this.queue.enqueue(JobType.MediaThumbnail, { mediaId: row.id });
    }
    if (rows.length === 0) {
      this.logger.log('Media thumbnail backfill has no more image rows.');
      return;
    }
    if (rows.length === PAGE) {
      const next = rows[rows.length - 1]!.id;
      await this.queue.enqueue(JobType.MediaThumbnailBackfill, { cursor: next });
    }
  }
}
