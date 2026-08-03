import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';

export interface AuditEntry {
  actorUserId?: string | null;
  actorCompanyId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
}

/**
 * Writes append-only records of trust-critical transitions (access approvals,
 * connection blocks, permission changes). Recording failures must never break
 * the business action, so writes are best-effort.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    // Best-effort: the business mutation has already committed, so a failed audit
    // write must never turn a successful action into a 500 for the caller.
    try {
      await this.prisma.auditLog.create({
        data: {
          actorUserId: entry.actorUserId ?? null,
          actorCompanyId: entry.actorCompanyId ?? null,
          action: entry.action,
          targetType: entry.targetType,
          targetId: entry.targetId,
          before: entry.before,
          after: entry.after,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log for ${entry.action} on ${entry.targetType}:${entry.targetId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
