import { Injectable } from '@nestjs/common';
import { JobType } from '@ekum/domain-types';
import { NotificationService } from '../../notifications/notification.service';
import { JobQueue, nextDailyRun } from '../job-queue.service';
import type { JobHandler } from '../job.types';

const DIGEST_HOUR_UTC = 3; // ~08:30 IST

/**
 * The recurring daily digest sweep: pushes each company a summary of what it
 * missed, then re-schedules itself for the next day. Self-rescheduling keeps the
 * cadence in the durable job table rather than an in-memory cron.
 */
@Injectable()
export class NotificationDigestHandler implements JobHandler {
  readonly type = JobType.NotificationDigest;

  constructor(
    private readonly notifications: NotificationService,
    private readonly queue: JobQueue,
  ) {}

  async run(): Promise<void> {
    try {
      await this.notifications.sendDailyDigest();
    } finally {
      // Always re-arm tomorrow's sweep, even if this run partially failed.
      await this.queue.enqueue(JobType.NotificationDigest, {}, nextDailyRun(DIGEST_HOUR_UTC));
    }
  }
}
