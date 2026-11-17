import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConnectionStatus, type ConnectionView } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CompanySerializer } from './company.serializer';
import type { AuthPrincipal } from '../auth/auth.types';
import { counterpartCompanyId } from './connection-pair';
import { deleteOwnBlock, hasOwnBlock, upsertOwnBlock } from './company-block';

type ConnectionAction = 'pause' | 'resume' | 'block' | 'unblock';

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

    const myBlocks = await this.prisma.companyBlock.findMany({
      where: { blockerCompanyId: companyId },
      select: { blockedCompanyId: true },
    });
    const iBlocked = new Set(myBlocks.map((row) => row.blockedCompanyId));

    const theirBlocks = await this.prisma.companyBlock.findMany({
      where: { blockedCompanyId: companyId },
      select: { blockerCompanyId: true },
    });
    const theyBlockedMe = new Set(theirBlocks.map((row) => row.blockerCompanyId));

    return connections
      .filter((connection) => {
        const otherId = counterpartCompanyId(companyId, connection);
        const iHaveEdge = iBlocked.has(otherId);
        const theyHaveEdge = theyBlockedMe.has(otherId);
        const legacyBlocked = connection.status === ConnectionStatus.Blocked;

        // Pause: only the pauser sees the row.
        if (connection.status === ConnectionStatus.Paused) {
          return connection.statusSetByCompanyId === companyId;
        }

        // Directed / legacy block: only show if I own a block (silent for the other side).
        if (iHaveEdge || (legacyBlocked && connection.statusSetByCompanyId === companyId)) {
          return true;
        }
        if (theyHaveEdge || (legacyBlocked && connection.statusSetByCompanyId !== companyId)) {
          return false;
        }

        // Active, no blocks either way.
        return connection.status === ConnectionStatus.Active;
      })
      .map((connection) => {
        const otherId = counterpartCompanyId(companyId, connection);
        const iHaveEdge =
          iBlocked.has(otherId) ||
          (connection.status === ConnectionStatus.Blocked &&
            connection.statusSetByCompanyId === companyId);
        return this.toView(companyId, connection, {
          iBlockedThem: iHaveEdge,
          pairRestricted: iHaveEdge || theyBlockedMe.has(otherId),
        });
      });
  }

  /**
   * Either-side state changes. Block/Unblock are directed CompanyBlock edges.
   * Pause remains legacy on Connection.statusSetByCompanyId.
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

    if (action === 'pause') {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: 'Pause is not used. Block this business instead.',
      });
    }

    const otherId = counterpartCompanyId(companyId, connection);

    if (action === 'block') {
      const updated = await this.prisma.$transaction(async (tx) => {
        await upsertOwnBlock(tx, companyId, otherId);
        return tx.connection.findUniqueOrThrow({
          where: { id: connection.id },
          include: { companyLow: true, companyHigh: true },
        });
      });
      await this.audit.record({
        actorUserId: actor.userId,
        actorCompanyId: companyId,
        action: 'connection.block',
        targetType: 'connection',
        targetId: connection.id,
        after: { companyBlock: `${companyId}->${otherId}` },
      });
      return this.toView(companyId, updated, { iBlockedThem: true, pairRestricted: true });
    }

    if (action === 'unblock') {
      const own = await hasOwnBlock(this.prisma, companyId, otherId);
      const legacyActor =
        connection.status === ConnectionStatus.Blocked &&
        connection.statusSetByCompanyId === companyId;
      if (!own && !legacyActor) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Connection not found.' });
      }
      const { stillRestricted } = await this.prisma.$transaction(async (tx) => {
        const result = await deleteOwnBlock(tx, companyId, otherId);
        return result;
      });
      const updated = await this.prisma.connection.findUniqueOrThrow({
        where: { id: connection.id },
        include: { companyLow: true, companyHigh: true },
      });
      await this.audit.record({
        actorUserId: actor.userId,
        actorCompanyId: companyId,
        action: 'connection.unblock',
        targetType: 'connection',
        targetId: connection.id,
        after: {
          companyBlockRemoved: `${companyId}->${otherId}`,
          stillRestricted,
        },
      });
      return this.toView(companyId, updated, {
        iBlockedThem: false,
        pairRestricted: stillRestricted,
      });
    }

    // resume — legacy Pause only
    if (connection.status !== ConnectionStatus.Paused) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: `Cannot resume a ${connection.status} connection.`,
      });
    }
    if (connection.statusSetByCompanyId !== companyId) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Connection not found.' });
    }
    const updated = await this.prisma.connection.update({
      where: { id: connection.id },
      data: { status: ConnectionStatus.Active, statusSetByCompanyId: null },
      include: { companyLow: true, companyHigh: true },
    });
    await this.audit.record({
      actorUserId: actor.userId,
      actorCompanyId: companyId,
      action: 'connection.resume',
      targetType: 'connection',
      targetId: connection.id,
      before: { status: connection.status, statusSetByCompanyId: connection.statusSetByCompanyId },
      after: { status: ConnectionStatus.Active, statusSetByCompanyId: null },
    });
    return this.toView(companyId, updated, { iBlockedThem: false, pairRestricted: false });
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
    flags: { iBlockedThem: boolean; pairRestricted: boolean },
  ): ConnectionView {
    const otherId = counterpartCompanyId(companyId, connection);
    const other =
      otherId === connection.companyLowId ? connection.companyLow : connection.companyHigh;
    const isPauseActor =
      connection.status === ConnectionStatus.Paused &&
      connection.statusSetByCompanyId === companyId;
    const displayStatus = flags.iBlockedThem
      ? ConnectionStatus.Blocked
      : connection.status === ConnectionStatus.Paused
        ? ConnectionStatus.Paused
        : ConnectionStatus.Active;
    return {
      id: connection.id,
      company: this.serializer.toPublicSummary(other),
      status: displayStatus,
      createdAt: connection.createdAt.toISOString(),
      canPause: false,
      canResume: isPauseActor,
      canBlock:
        !flags.iBlockedThem &&
        !flags.pairRestricted &&
        displayStatus !== ConnectionStatus.Paused,
      canUnblock: flags.iBlockedThem,
    };
  }
}
