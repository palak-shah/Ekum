import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConnectionStatus, type ConnectionView } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CompanySerializer } from './company.serializer';
import type { AuthPrincipal } from '../auth/auth.types';
import { counterpartCompanyId } from './connection-pair';

type ConnectionAction = 'pause' | 'resume' | 'block' | 'unblock';

const ACTION_TO_STATUS: Record<ConnectionAction, string> = {
  pause: ConnectionStatus.Paused,
  resume: ConnectionStatus.Active,
  block: ConnectionStatus.Blocked,
  unblock: ConnectionStatus.Active,
};

// Legal source states for each action. A block can only be lifted by unblock, so
// pause/resume must never touch a blocked connection.
const ALLOWED_FROM: Record<ConnectionAction, readonly string[]> = {
  pause: [ConnectionStatus.Active],
  resume: [ConnectionStatus.Paused],
  block: [ConnectionStatus.Active],
  unblock: [ConnectionStatus.Blocked],
};

@Injectable()
export class ConnectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly serializer: CompanySerializer,
  ) {}

  async list(companyId: string): Promise<ConnectionView[]> {
    const connections = await this.prisma.connection.findMany({
      where: { OR: [{ companyLowId: companyId }, { companyHighId: companyId }] },
      orderBy: { createdAt: 'desc' },
      include: { companyLow: true, companyHigh: true },
    });

    return connections
      .filter((connection) => {
        // Pause and block are silent: only the actor who set the status sees the row.
        if (connection.status === ConnectionStatus.Active) return true;
        return connection.statusSetByCompanyId === companyId;
      })
      .map((connection) => this.toView(companyId, connection));
  }

  /**
   * Either-side state changes. Pause and block are deliberately silent — no
   * notification is ever generated for these transitions. Only the actor who
   * paused/blocked may resume/unblock.
   */
  async applyOwnerAction(
    companyId: string,
    connectionId: string,
    action: ConnectionAction,
    actor: AuthPrincipal,
  ): Promise<ConnectionView> {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
      include: { companyLow: true, companyHigh: true },
    });
    if (
      !connection ||
      (connection.companyLowId !== companyId && connection.companyHighId !== companyId)
    ) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Connection not found.' });
    }

    if (!ALLOWED_FROM[action].includes(connection.status)) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: `Cannot ${action} a ${connection.status} connection.`,
      });
    }

    if (
      (action === 'resume' || action === 'unblock') &&
      connection.statusSetByCompanyId !== companyId
    ) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Connection not found.' });
    }

    const nextStatus = ACTION_TO_STATUS[action];
    const statusSetByCompanyId =
      nextStatus === ConnectionStatus.Active ? null : companyId;

    const updated = await this.prisma.connection.update({
      where: { id: connection.id },
      data: { status: nextStatus, statusSetByCompanyId },
      include: { companyLow: true, companyHigh: true },
    });

    await this.audit.record({
      actorUserId: actor.userId,
      actorCompanyId: companyId,
      action: `connection.${action}`,
      targetType: 'connection',
      targetId: connection.id,
      before: { status: connection.status, statusSetByCompanyId: connection.statusSetByCompanyId },
      after: { status: nextStatus, statusSetByCompanyId },
    });

    return this.toView(companyId, updated);
  }

  private toView(
    companyId: string,
    connection: {
      id: string;
      companyLowId: string;
      companyHighId: string;
      status: string;
      statusSetByCompanyId: string | null;
      createdAt: Date;
      companyLow: Parameters<CompanySerializer['toPublicSummary']>[0];
      companyHigh: Parameters<CompanySerializer['toPublicSummary']>[0];
    },
  ): ConnectionView {
    const otherId = counterpartCompanyId(companyId, connection);
    const other =
      otherId === connection.companyLowId ? connection.companyLow : connection.companyHigh;
    const isActor = connection.statusSetByCompanyId === companyId;
    return {
      id: connection.id,
      company: this.serializer.toPublicSummary(other),
      status: connection.status,
      createdAt: connection.createdAt.toISOString(),
      canPause: connection.status === ConnectionStatus.Active,
      canResume: connection.status === ConnectionStatus.Paused && isActor,
      canBlock: connection.status === ConnectionStatus.Active,
      canUnblock: connection.status === ConnectionStatus.Blocked && isActor,
    };
  }
}
