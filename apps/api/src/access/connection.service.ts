import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConnectionStatus, type ConnectionView } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CompanySerializer } from './company.serializer';
import type { AuthPrincipal } from '../auth/auth.types';

type OwnerAction = 'pause' | 'resume' | 'block' | 'unblock';

const ACTION_TO_STATUS: Record<OwnerAction, string> = {
  pause: ConnectionStatus.Paused,
  resume: ConnectionStatus.Active,
  block: ConnectionStatus.Blocked,
  unblock: ConnectionStatus.Active,
};

// Legal source states for each action. A block can only be lifted by unblock, so
// pause/resume must never touch a blocked connection.
const ALLOWED_FROM: Record<OwnerAction, readonly string[]> = {
  pause: [ConnectionStatus.Active],
  resume: [ConnectionStatus.Paused],
  block: [ConnectionStatus.Active, ConnectionStatus.Paused],
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
      where: { OR: [{ ownerCompanyId: companyId }, { viewerCompanyId: companyId }] },
      orderBy: { createdAt: 'desc' },
      include: { owner: true, viewer: true },
    });

    return connections.map((connection) => {
      const isOwner = connection.ownerCompanyId === companyId;
      return {
        id: connection.id,
        company: this.serializer.toPublicSummary(isOwner ? connection.viewer : connection.owner),
        role: isOwner ? 'owner' : 'viewer',
        status: connection.status,
        createdAt: connection.createdAt.toISOString(),
      };
    });
  }

  /**
   * Owner-only state changes. Pause and block are deliberately silent — no
   * notification is ever generated for these transitions.
   */
  async applyOwnerAction(
    companyId: string,
    connectionId: string,
    action: OwnerAction,
    actor: AuthPrincipal,
  ): Promise<ConnectionView> {
    const connection = await this.prisma.connection.findUnique({ where: { id: connectionId } });
    // Only the catalogue owner controls the connection; otherwise hide it.
    if (!connection || connection.ownerCompanyId !== companyId) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Connection not found.' });
    }

    if (!ALLOWED_FROM[action].includes(connection.status)) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: `Cannot ${action} a ${connection.status} connection.`,
      });
    }

    const nextStatus = ACTION_TO_STATUS[action];
    const updated = await this.prisma.connection.update({
      where: { id: connection.id },
      data: { status: nextStatus },
      include: { viewer: true },
    });

    await this.audit.record({
      actorUserId: actor.userId,
      actorCompanyId: companyId,
      action: `connection.${action}`,
      targetType: 'connection',
      targetId: connection.id,
      before: { status: connection.status },
      after: { status: nextStatus },
    });

    return {
      id: updated.id,
      company: this.serializer.toPublicSummary(updated.viewer),
      role: 'owner',
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
