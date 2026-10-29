import { Global, Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { JobQueue } from './job-queue.service';
import { JobRunner } from './job-runner.service';
import { JOB_HANDLERS, type JobHandler } from './job.types';
import { storageProvider } from '../media/storage/storage.provider';
import { MediaThumbnailHandler } from './handlers/media-thumbnail.handler';
import { MediaThumbnailBackfillHandler } from './handlers/media-thumbnail-backfill.handler';
import { ReturnWindowHandler } from './handlers/return-window.handler';
import { NotificationDigestHandler } from './handlers/notification-digest.handler';
import { CollectionExpireHandler } from './handlers/collection-expire.handler';
import { CollectionPropagateHandler } from './handlers/collection-propagate.handler';
import { CatalogModule } from '../catalog/catalog.module';

/**
 * The durable background-job backbone. The Postgres `Job` table is the queue;
 * JobRunner polls and dispatches to registered handlers. JobQueue is global so
 * any domain can enqueue (media thumbnails, return-window expiry, digests).
 */
@Global()
@Module({
  imports: [NotificationsModule, CatalogModule],
  providers: [
    storageProvider,
    JobQueue,
    JobRunner,
    MediaThumbnailHandler,
    MediaThumbnailBackfillHandler,
    ReturnWindowHandler,
    NotificationDigestHandler,
    CollectionExpireHandler,
    CollectionPropagateHandler,
    {
      provide: JOB_HANDLERS,
      useFactory: (
        media: MediaThumbnailHandler,
        backfill: MediaThumbnailBackfillHandler,
        returnWindow: ReturnWindowHandler,
        digest: NotificationDigestHandler,
        collectionExpire: CollectionExpireHandler,
        collectionPropagate: CollectionPropagateHandler,
      ): JobHandler[] => [
        media,
        backfill,
        returnWindow,
        digest,
        collectionExpire,
        collectionPropagate,
      ],
      inject: [
        MediaThumbnailHandler,
        MediaThumbnailBackfillHandler,
        ReturnWindowHandler,
        NotificationDigestHandler,
        CollectionExpireHandler,
        CollectionPropagateHandler,
      ],
    },
  ],
  exports: [JobQueue],
})
export class JobsModule {}
