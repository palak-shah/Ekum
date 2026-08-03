import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { JobStatus, JobType } from '@ekum/domain-types';
import type { Env } from '../core/config/config.schema';
import { PrismaService } from '../core/prisma/prisma.service';
import { JobQueue } from './job-queue.service';
import { JOB_HANDLERS, type JobHandler } from './job.types';

interface ClaimedJob {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  attempts: number;
  maxAttempts: number;
}

const BATCH_SIZE = 10;
const DIGEST_HOUR_UTC = 3; // ~08:30 IST

/**
 * Claims and runs due jobs. Postgres is the queue: each tick claims a batch with
 * FOR UPDATE SKIP LOCKED so concurrent instances never grab the same row. Failures
 * retry with exponential backoff until maxAttempts, then park as `failed`. The
 * loop is a plain interval (no cron dependency) and never starts under test.
 */
@Injectable()
export class JobRunner implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(JobRunner.name);
  private readonly handlers: Map<string, JobHandler>;
  private timer: ReturnType<typeof setInterval> | null = null;
  private ticking = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: JobQueue,
    private readonly config: ConfigService<Env, true>,
    @Inject(JOB_HANDLERS) handlers: JobHandler[],
  ) {
    this.handlers = new Map(handlers.map((handler) => [handler.type, handler]));
  }

  async onApplicationBootstrap(): Promise<void> {
    const enabled = this.config.get('JOBS_ENABLED', { infer: true });
    const isTest = this.config.get('NODE_ENV', { infer: true }) === 'test';
    if (!enabled || isTest) {
      return;
    }
    // Seed the recurring digest sweep, then begin polling.
    await this.queue.ensureDaily(JobType.NotificationDigest, DIGEST_HOUR_UTC).catch((error) => {
      this.logger.warn(`Could not seed digest job: ${describe(error)}`);
    });
    const pollMs = this.config.get('JOBS_POLL_MS', { infer: true });
    this.timer = setInterval(() => void this.tick(), pollMs);
    this.logger.log(`Job runner started (poll ${pollMs}ms, ${this.handlers.size} handlers)`);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** One poll cycle. Guarded so a slow batch never overlaps the next tick. */
  async tick(): Promise<void> {
    if (this.ticking) {
      return;
    }
    this.ticking = true;
    try {
      const claimed = await this.claim(BATCH_SIZE);
      for (const job of claimed) {
        await this.process(job);
      }
    } catch (error) {
      this.logger.error(`Job poll failed: ${describe(error)}`);
    } finally {
      this.ticking = false;
    }
  }

  private async process(job: ClaimedJob): Promise<void> {
    const handler = this.handlers.get(job.type);
    try {
      if (!handler) {
        throw new Error(`No handler registered for job type "${job.type}".`);
      }
      await handler.run(job.payload ?? {});
      await this.prisma.job.update({
        where: { id: job.id },
        data: { status: JobStatus.Done, lastError: null },
      });
    } catch (error) {
      const message = describe(error);
      const exhausted = job.attempts >= job.maxAttempts;
      await this.prisma.job.update({
        where: { id: job.id },
        data: exhausted
          ? { status: JobStatus.Failed, lastError: message }
          : { status: JobStatus.Pending, lastError: message, runAt: backoff(job.attempts) },
      });
      this.logger.warn(
        `Job ${job.id} (${job.type}) ${exhausted ? 'failed permanently' : 'will retry'}: ${message}`,
      );
    }
  }

  /** Atomically claims up to `limit` due jobs, marking them running. */
  private claim(limit: number): Promise<ClaimedJob[]> {
    return this.prisma.$queryRaw<ClaimedJob[]>(Prisma.sql`
      UPDATE "Job" AS j
      SET status = 'running', "lockedAt" = now(), attempts = attempts + 1, "updatedAt" = now()
      FROM (
        SELECT id FROM "Job"
        WHERE status = 'pending' AND "runAt" <= now()
        ORDER BY "runAt" ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      ) AS due
      WHERE j.id = due.id
      RETURNING j.id, j.type, j.payload, j.attempts, j."maxAttempts";
    `);
  }
}

/** Exponential backoff capped at 5 minutes. `attempts` is the count so far. */
function backoff(attempts: number): Date {
  const delayMs = Math.min(2 ** attempts * 1000, 5 * 60_000);
  return new Date(Date.now() + delayMs);
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
