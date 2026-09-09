import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  COLLECTION_VIEW_REQUEST_META,
  CollectionStatus,
  CollectionViewRequestStatus,
  MessageType,
  type CollectionViewGrantView,
  type CollectionViewRequestView,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { CompanySerializer } from '../access/company.serializer';
import { ThreadService } from '../conversation/thread.service';
import { DomainEvents } from '../events/events.module';
import { isCollectionLiveForBuyers } from './collection-schedule';

@Injectable()
export class CollectionViewRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companies: CompanySerializer,
    @Inject(forwardRef(() => ThreadService))
    private readonly threads: ThreadService,
    private readonly events: DomainEvents,
  ) {}

  async create(
    requesterCompanyId: string,
    collectionId: string,
  ): Promise<CollectionViewRequestView> {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      include: { company: true },
    });
    if (!collection || collection.status !== CollectionStatus.Published) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
    }
    if (!isCollectionLiveForBuyers(collection)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
    }
    if (collection.companyId === requesterCompanyId) {
      throw new BadRequestException({
        code: 'INVALID_TARGET',
        message: 'You already own this collection.',
      });
    }

    const existingGrant = await this.prisma.collectionViewGrant.findUnique({
      where: {
        collectionId_companyId: { collectionId, companyId: requesterCompanyId },
      },
    });
    if (existingGrant) {
      throw new ConflictException({
        code: 'ALREADY_GRANTED',
        message: 'You can already look through this pack.',
      });
    }

    const pending = await this.prisma.collectionViewRequest.findFirst({
      where: {
        collectionId,
        requesterCompanyId,
        status: CollectionViewRequestStatus.Pending,
      },
    });
    if (pending) {
      // Older asks may lack a collection card — ensure one exists so Allow/Deny show.
      const existingMsg = pending.messageId
        ? await this.prisma.message.findUnique({
            where: { id: pending.messageId },
            select: { id: true, type: true },
          })
        : null;
      const needsCard =
        !existingMsg || existingMsg.type !== MessageType.CollectionCard;
      if (needsCard) {
        const meta = {
          kind: COLLECTION_VIEW_REQUEST_META,
          requestId: pending.id,
          collectionId,
          collectionName: collection.name,
          coverImage: collection.coverImage,
          status: CollectionViewRequestStatus.Pending,
          requesterCompanyId,
          targetCompanyId: collection.companyId,
        };
        const threadId =
          pending.threadId ??
          (await this.threads.ensureTradeThread(requesterCompanyId, collection.companyId));
        const message = await this.prisma.message.create({
          data: {
            threadId,
            senderCompanyId: requesterCompanyId,
            type: MessageType.CollectionCard,
            body: 'Asked to see this pack',
            referenceId: collectionId,
            metadata: meta,
          },
        });
        if (existingMsg && existingMsg.type === MessageType.System) {
          await this.prisma.message.delete({ where: { id: existingMsg.id } }).catch(() => undefined);
        }
        await this.prisma.collectionViewRequest.update({
          where: { id: pending.id },
          data: { messageId: message.id, threadId },
        });
        await this.prisma.thread.update({
          where: { id: threadId },
          data: { lastMessageAt: new Date() },
        });
      }
      return this.toView(pending.id);
    }

    const threadId = await this.threads.ensureTradeThread(
      requesterCompanyId,
      collection.companyId,
    );

    const created = await this.prisma.collectionViewRequest.create({
      data: {
        collectionId,
        requesterCompanyId,
        targetCompanyId: collection.companyId,
        status: CollectionViewRequestStatus.Pending,
        threadId,
      },
    });

    const meta = {
      kind: COLLECTION_VIEW_REQUEST_META,
      requestId: created.id,
      collectionId,
      collectionName: collection.name,
      coverImage: collection.coverImage,
      status: CollectionViewRequestStatus.Pending,
      requesterCompanyId,
      targetCompanyId: collection.companyId,
    };

    // Collection card so the owner sees which pack — Allow/Deny sit on this card.
    const message = await this.prisma.message.create({
      data: {
        threadId,
        senderCompanyId: requesterCompanyId,
        type: MessageType.CollectionCard,
        body: 'Asked to see this pack',
        referenceId: collectionId,
        metadata: meta,
      },
    });
    await this.prisma.collectionViewRequest.update({
      where: { id: created.id },
      data: { messageId: message.id },
    });
    await this.prisma.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });

    return this.toView(created.id);
  }

  async allow(
    actorCompanyId: string,
    requestId: string,
  ): Promise<CollectionViewRequestView> {
    const request = await this.loadPendingForOwner(actorCompanyId, requestId);
    const collection = await this.prisma.collection.findUnique({
      where: { id: request.collectionId },
      select: { id: true, name: true },
    });
    if (!collection) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
    }

    await this.prisma.collectionViewGrant.upsert({
      where: {
        collectionId_companyId: {
          collectionId: request.collectionId,
          companyId: request.requesterCompanyId,
        },
      },
      create: {
        collectionId: request.collectionId,
        companyId: request.requesterCompanyId,
      },
      update: { grantedAt: new Date() },
    });

    const now = new Date();
    await this.prisma.collectionViewRequest.update({
      where: { id: request.id },
      data: { status: CollectionViewRequestStatus.Allowed, decidedAt: now },
    });

    if (request.messageId) {
      const existing = await this.prisma.message.findUnique({
        where: { id: request.messageId },
        select: { metadata: true },
      });
      const prev =
        existing?.metadata && typeof existing.metadata === 'object'
          ? (existing.metadata as Record<string, unknown>)
          : {};
      await this.prisma.message.update({
        where: { id: request.messageId },
        data: {
          body: `Allowed · ${collection.name}`,
          metadata: {
            ...prev,
            kind: COLLECTION_VIEW_REQUEST_META,
            requestId: request.id,
            collectionId: request.collectionId,
            collectionName: collection.name,
            status: CollectionViewRequestStatus.Allowed,
            requesterCompanyId: request.requesterCompanyId,
            targetCompanyId: request.targetCompanyId,
          },
        },
      });
    }

    if (request.threadId) {
      await this.prisma.message.create({
        data: {
          threadId: request.threadId,
          senderCompanyId: actorCompanyId,
          type: MessageType.System,
          body: `You can view ${collection.name}`,
          referenceId: request.collectionId,
          metadata: {
            kind: 'collection_view_granted',
            side: 'company',
            companyId: request.requesterCompanyId,
            collectionId: request.collectionId,
            collectionName: collection.name,
          },
        },
      });
      await this.prisma.thread.update({
        where: { id: request.threadId },
        data: { lastMessageAt: now },
      });
    }

    this.events.collectionViewGranted({
      requestId: request.id,
      collectionId: request.collectionId,
      collectionName: collection.name,
      requesterCompanyId: request.requesterCompanyId,
      targetCompanyId: request.targetCompanyId,
    });

    return this.toView(request.id);
  }

  async deny(actorCompanyId: string, requestId: string): Promise<{ ok: true }> {
    const request = await this.loadPendingForOwner(actorCompanyId, requestId);
    const collection = await this.prisma.collection.findUnique({
      where: { id: request.collectionId },
      select: { name: true },
    });
    const now = new Date();
    await this.prisma.collectionViewRequest.update({
      where: { id: request.id },
      data: { status: CollectionViewRequestStatus.Denied, decidedAt: now },
    });

    if (request.messageId) {
      const existing = await this.prisma.message.findUnique({
        where: { id: request.messageId },
        select: { metadata: true },
      });
      const prev =
        existing?.metadata && typeof existing.metadata === 'object'
          ? (existing.metadata as Record<string, unknown>)
          : {};
      await this.prisma.message.update({
        where: { id: request.messageId },
        data: {
          body: `Declined · ${collection?.name ?? 'collection'}`,
          metadata: {
            ...prev,
            kind: COLLECTION_VIEW_REQUEST_META,
            requestId: request.id,
            collectionId: request.collectionId,
            collectionName: collection?.name ?? null,
            status: CollectionViewRequestStatus.Denied,
            requesterCompanyId: request.requesterCompanyId,
            targetCompanyId: request.targetCompanyId,
          },
        },
      });
    }
    // No chat/notif to requester — messageVisibleToCompany hides denied card from them.
    return { ok: true };
  }

  async listOutgoingPending(
    requesterCompanyId: string,
  ): Promise<CollectionViewRequestView[]> {
    const rows = await this.prisma.collectionViewRequest.findMany({
      where: {
        requesterCompanyId,
        status: CollectionViewRequestStatus.Pending,
      },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(rows.map((row) => this.toView(row.id)));
  }

  async listGrantsForCollection(
    ownerCompanyId: string,
    collectionId: string,
  ): Promise<CollectionViewGrantView[]> {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, companyId: ownerCompanyId },
      select: { id: true, name: true },
    });
    if (!collection) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
    }
    const grants = await this.prisma.collectionViewGrant.findMany({
      where: { collectionId },
      include: { company: true },
      orderBy: { grantedAt: 'desc' },
    });
    return grants.map((row) => ({
      companyId: row.companyId,
      company: this.companies.toPublicSummary(row.company),
      grantedAt: row.grantedAt.toISOString(),
      collectionId: collection.id,
      collectionName: collection.name,
    }));
  }

  async revokeGrant(
    ownerCompanyId: string,
    collectionId: string,
    companyId: string,
  ): Promise<{ ok: true }> {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, companyId: ownerCompanyId },
      select: { id: true },
    });
    if (!collection) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
    }
    await this.prisma.collectionViewGrant.deleteMany({
      where: { collectionId, companyId },
    });
    return { ok: true };
  }

  async listMyGrants(viewerCompanyId: string): Promise<CollectionViewGrantView[]> {
    const grants = await this.prisma.collectionViewGrant.findMany({
      where: { companyId: viewerCompanyId },
      include: {
        collection: { include: { company: true } },
        company: true,
      },
      orderBy: { grantedAt: 'desc' },
    });
    return grants.map((row) => ({
      companyId: row.companyId,
      company: this.companies.toPublicSummary(row.collection.company),
      grantedAt: row.grantedAt.toISOString(),
      collectionId: row.collectionId,
      collectionName: row.collection.name,
    }));
  }

  private async loadPendingForOwner(actorCompanyId: string, requestId: string) {
    const request = await this.prisma.collectionViewRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Request not found.' });
    }
    if (request.targetCompanyId !== actorCompanyId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Not your request to decide.' });
    }
    if (request.status !== CollectionViewRequestStatus.Pending) {
      throw new ConflictException({
        code: 'ALREADY_DECIDED',
        message: 'This ask was already decided.',
      });
    }
    return request;
  }

  private async toView(id: string): Promise<CollectionViewRequestView> {
    const row = await this.prisma.collectionViewRequest.findUniqueOrThrow({
      where: { id },
      include: {
        collection: { select: { id: true, name: true } },
        requester: true,
        target: true,
      },
    });
    return {
      id: row.id,
      collectionId: row.collectionId,
      collectionName: row.collection.name,
      status: row.status,
      threadId: row.threadId,
      requester: this.companies.toPublicSummary(row.requester),
      target: this.companies.toPublicSummary(row.target),
      createdAt: row.createdAt.toISOString(),
      decidedAt: row.decidedAt?.toISOString() ?? null,
    };
  }
}
