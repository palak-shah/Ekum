import { Global, Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { JobQueue } from './job-queue.service';
import { JobRunner } from './job-runner.service';
import { JOB_HANDLERS, type JobHandler } from './job.types';
import { MediaThumbnailHandler } from './handlers/media-thumbnail.handler';
import { ReturnWindowHandler } from './handlers/return-window.handler';
import { NotificationDigestHandler } from './handlers/notification-digest.handler';

/**
 * The durable background-job backbone. The Postgres `Job` table is the queue;
 * JobRunner polls and dispatches to registered handlers. JobQueue is global so
 * any domain can enqueue (media thumbnails, return-window expiry, digests).
 */
@Global()
@Module({
  imports: [NotificationsModule],
  providers: [
    JobQueue,
    JobRunner,
    MediaThumbnailHandler,
    ReturnWindowHandler,
    NotificationDigestHandler,
    {
      provide: JOB_HANDLERS,
      useFactory: (
        media: MediaThumbnailHandler,
        returnWindow: ReturnWindowHandler,
        digest: NotificationDigestHandler,
      ): JobHandler[] => [media, returnWindow, digest],
      inject: [MediaThumbnailHandler, ReturnWindowHandler, NotificationDigestHandler],
    },
  ],
  exports: [JobQueue],
})
export class JobsModule {}
