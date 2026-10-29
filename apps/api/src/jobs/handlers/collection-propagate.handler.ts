import { Injectable, Logger } from '@nestjs/common';
import { JobType } from '@ekum/domain-types';
import type { JobHandler } from '../job.types';
import { CollectionPropagateService } from '../../catalog/collection-propagate.service';

@Injectable()
export class CollectionPropagateHandler implements JobHandler {
  readonly type = JobType.CollectionPropagate;
  private readonly logger = new Logger(CollectionPropagateHandler.name);

  constructor(private readonly propagate: CollectionPropagateService) {}

  async run(payload: Record<string, unknown>): Promise<void> {
    const collectionId = typeof payload.collectionId === 'string' ? payload.collectionId : null;
    if (!collectionId) {
      throw new Error('collection.propagate job is missing collectionId.');
    }
    this.logger.log(`Propagate collection ${collectionId}`);
    await this.propagate.propagate(collectionId);
  }
}
