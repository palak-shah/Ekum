import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JobStatus, type JobType } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';

/**
 * Enqueues durable jobs into the Postgres-backed queue. The `Job` table is the
 * queue: no external broker, so the job outlives a process restart and is visible
 * to every instance (the runner claims rows with FOR UPDATE SKIP LOCKED).
 */
@Injectable()
export class JobQueue {
  constructor(private readonly prisma: PrismaService) {}

  async enqueue(
    type: JobType,
    payload: Record<string, unknown> = {},
    runAt: Date = new Date(),
  ): Promise<string> {
    const job = await this.prisma.job.create({
      data: {
        type,
        payload: payload as Prisma.InputJsonValue,
        runAt,
        status: JobStatus.Pending,
      },
      select: { id: true },
    });
    return job.id;
  }

  /**
   * Ensures a single pending job of `type` exists, scheduled at the next daily
   * run. Used for recurring sweeps (digests) so a restart never duplicates them.
   */
  async ensureDaily(type: JobType, hourUtc: number): Promise<void> {
    const pending = await this.prisma.job.count({
      where: { type, status: JobStatus.Pending },
    });
    if (pending > 0) {
      return;
    }
    await this.enqueue(type, {}, nextDailyRun(hourUtc));
  }
}

/** The next UTC instant at the given hour (today if still ahead, else tomorrow). */
export function nextDailyRun(hourUtc: number, now: Date = new Date()): Date {
  const next = new Date(now);
  next.setUTCHours(hourUtc, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}
