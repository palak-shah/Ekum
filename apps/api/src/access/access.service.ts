import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccessRequestStatus,
  ConnectionStatus,
  type AccessRequestView,
  type CreateAccessRequestDto,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CompanySerializer } from './company.serializer';
import type { AuthPrincipal } from '../auth/auth.types';

@Injectable()
export class AccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly serializer: CompanySerializer,
  ) {}

  async createRequest(
    requesterCompanyId: string,
    dto: CreateAccessRequestDto,
  ): Promise<AccessRequestView> {
    const { targetCompanyId } = dto;
    if (targetCompanyId === requesterCompanyId) {
      throw new BadRequestException({
        code: 'INVALID_TARGET',
        message: 'You cannot request access to your own business.',
      });
    }

    const target = await this.prisma.company.findUnique({ where: { id: targetCompanyId } });
    // If the target has blocked this company, behave as if it does not exist.
    const connection = await this.prisma.connection.findUnique({
      where: {
        ownerCompanyId_viewerCompanyId: {
          ownerCompanyId: targetCompanyId,
          viewerCompanyId: requesterCompanyId,
        },
      },
    });
    if (!target || connection?.status === ConnectionStatus.Blocked) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Business not found.' });
    }
    if (connection?.status === ConnectionStatus.Active) {
      throw new ConflictException({
        code: 'ALREADY_CONNECTED',
        message: 'You are already connected to this business.',
      });
    }

    const existingPending = await this.prisma.accessRequest.findFirst({
      where: {
        requesterCompanyId,
        targetCompanyId,
        status: AccessRequestStatus.Pending,
      },
    });
    if (existingPending) {
      return this.toView(existingPending.id, 'target');
    }

    const created = await this.prisma.accessRequest.create({
      data: {
        requesterCompanyId,
        targetCompanyId,
        note: dto.note ?? null,
        referredBy: dto.referredBy ?? null,
      },
    });
    return this.toView(created.id, 'target');
  }

  async listIncoming(companyId: string): Promise<AccessRequestView[]> {
    const requests = await this.prisma.accessRequest.findMany({
      where: { targetCompanyId: companyId, status: AccessRequestStatus.Pending },
      orderBy: { createdAt: 'desc' },
      include: { requester: true },
    });
    return requests.map((request) => ({
      id: request.id,
      company: this.serializer.toPublicSummary(request.requester),
      note: request.note,
      referredBy: request.referredBy,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    }));
  }

  async listOutgoing(companyId: string): Promise<AccessRequestView[]> {
    const requests = await this.prisma.accessRequest.findMany({
      where: { requesterCompanyId: companyId },
      orderBy: { createdAt: 'desc' },
      include: { target: true },
    });
    return requests.map((request) => ({
      id: request.id,
      company: this.serializer.toPublicSummary(request.target),
      note: request.note,
      referredBy: request.referredBy,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    }));
  }

  async approve(
    companyId: string,
    requestId: string,
    actor: AuthPrincipal,
  ): Promise<AccessRequestView> {
    const request = await this.loadDecidableRequest(companyId, requestId);

    // A block must be lifted explicitly; approving a request must never silently
    // reactivate a connection the owner has blocked.
    const existingConnection = await this.prisma.connection.findUnique({
      where: {
        ownerCompanyId_viewerCompanyId: {
          ownerCompanyId: request.targetCompanyId,
          viewerCompanyId: request.requesterCompanyId,
        },
      },
    });
    if (existingConnection?.status === ConnectionStatus.Blocked) {
      throw new ConflictException({
        code: 'CONNECTION_BLOCKED',
        message: 'This business is blocked. Unblock it before approving.',
      });
    }

    await this.prisma.$transaction([
      this.prisma.accessRequest.update({
        where: { id: request.id },
        data: { status: AccessRequestStatus.Approved, decidedAt: new Date() },
      }),
      this.prisma.connection.upsert({
        where: {
          ownerCompanyId_viewerCompanyId: {
            ownerCompanyId: request.targetCompanyId,
            viewerCompanyId: request.requesterCompanyId,
          },
        },
        create: {
          ownerCompanyId: request.targetCompanyId,
          viewerCompanyId: request.requesterCompanyId,
          status: ConnectionStatus.Active,
        },
        update: { status: ConnectionStatus.Active },
      }),
    ]);

    await this.audit.record({
      actorUserId: actor.userId,
      actorCompanyId: companyId,
      action: 'access.approved',
      targetType: 'access_request',
      targetId: request.id,
      after: { status: AccessRequestStatus.Approved },
    });

    return this.toView(request.id, 'requester');
  }

  async decline(
    companyId: string,
    requestId: string,
    actor: AuthPrincipal,
  ): Promise<AccessRequestView> {
    const request = await this.loadDecidableRequest(companyId, requestId);

    await this.prisma.accessRequest.update({
      where: { id: request.id },
      data: { status: AccessRequestStatus.Declined, decidedAt: new Date() },
    });

    // Declines are quiet: the requester is never notified.
    await this.audit.record({
      actorUserId: actor.userId,
      actorCompanyId: companyId,
      action: 'access.declined',
      targetType: 'access_request',
      targetId: request.id,
      after: { status: AccessRequestStatus.Declined },
    });

    return this.toView(request.id, 'requester');
  }

  private async loadDecidableRequest(companyId: string, requestId: string) {
    const request = await this.prisma.accessRequest.findUnique({ where: { id: requestId } });
    // Hide requests that aren't ours to decide, rather than revealing they exist.
    if (!request || request.targetCompanyId !== companyId) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Request not found.' });
    }
    if (request.status !== AccessRequestStatus.Pending) {
      throw new ConflictException({
        code: 'ALREADY_DECIDED',
        message: 'This request has already been handled.',
      });
    }
    return request;
  }

  /**
   * Serializes a request from a given perspective: the requester sees the target
   * they asked, while the target (owner) sees the requester they are deciding on.
   */
  private async toView(
    requestId: string,
    show: 'requester' | 'target',
  ): Promise<AccessRequestView> {
    const request = await this.prisma.accessRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { requester: true, target: true },
    });
    const company = show === 'requester' ? request.requester : request.target;
    return {
      id: request.id,
      company: this.serializer.toPublicSummary(company),
      note: request.note,
      referredBy: request.referredBy,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    };
  }
}
