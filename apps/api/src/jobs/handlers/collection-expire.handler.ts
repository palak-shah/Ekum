import { Injectable, Logger } from '@nestjs/common';
import { CollectionStatus, JobType } from '@ekum/domain-types';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { JobHandler } from '../job.types';

/**
 * Hides a published collection when its endsAt window passes (same as seller Hide → draft).
 * Idempotent: already-draft / archived / missing rows are no-ops.
 */
@Injectable()
export class CollectionExpireHandler implements JobHandler {
  readonly type = JobType.CollectionExpire;
  private readonly logger = new Logger(CollectionExpireHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(payload: Record<string, unknown>): Promise<void> {
    const collectionId = typeof payload.collectionId === 'string' ? payload.collectionId : null;
    if (!collectionId) {
      throw new Error('collection.expire job is missing collectionId.');
    }
    const collection = await this.prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection) {
      this.logger.warn(`Collection ${collectionId} vanished before expiry; skipping.`);
      return;
    }
    if (collection.status !== CollectionStatus.Published) {
      return;
    }
    if (!collection.endsAt || collection.endsAt.getTime() > Date.now()) {
      return;
    }

    await this.prisma.collection.update({
      where: { id: collectionId },
      data: {
        status: CollectionStatus.Draft,
        exploreActivityAt: null,
      },
    });
  }
}
