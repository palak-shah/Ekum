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
  CollectionStatus,
  MessageType,
  ProductStatus,
  RELIST_REQUEST_META,
  RelistRequestStatus,
  type CheckRelistAccessDto,
  type CreateRelistRequestDto,
  type ProductRelistGrantView,
  type RelistAccessView,
  type RelistRequestView,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { CompanySerializer } from '../access/company.serializer';
import { ThreadService } from '../conversation/thread.service';
import { DomainEvents } from '../events/events.module';
import { isCollectionLiveForBuyers } from './collection-schedule';

@Injectable()
export class RelistRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companies: CompanySerializer,
    @Inject(forwardRef(() => ThreadService))
    private readonly threads: ThreadService,
    private readonly events: DomainEvents,
  ) {}

  async create(
    requesterCompanyId: string,
    dto: CreateRelistRequestDto,
  ): Promise<RelistRequestView> {
    const uniqueIds = [...new Set(dto.productIds.map((id) => id.trim()).filter(Boolean))];
    if (uniqueIds.length < 1) {
      throw new BadRequestException({
        code: 'INVALID_PRODUCTS',
        message: 'Pick at least one design.',
      });
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: uniqueIds }, status: ProductStatus.Published },
      select: {
        id: true,
        name: true,
        companyId: true,
        allowForward: true,
        images: true,
      },
    });
    if (products.length !== uniqueIds.length) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'One or more designs could not be found.',
      });
    }

    let targetCompanyId: string;
    let sourceCollectionId: string | null = null;

    if (dto.sourceCollectionId) {
      const collection = await this.prisma.collection.findUnique({
        where: { id: dto.sourceCollectionId },
        select: {
          id: true,
          companyId: true,
          status: true,
          allowForward: true,
          startsAt: true,
          endsAt: true,
          products: { where: { productId: { in: uniqueIds } }, select: { productId: true } },
        },
      });
      if (
        !collection ||
        collection.status !== CollectionStatus.Published ||
        !isCollectionLiveForBuyers(collection)
      ) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Pack not found.' });
      }
      if (collection.products.length !== uniqueIds.length) {
        throw new BadRequestException({
          code: 'NOT_IN_PACK',
          message: 'Those designs are not in this pack.',
        });
      }
      if (collection.allowForward) {
        throw new ConflictException({
          code: 'ALREADY_ALLOWED',
          message: 'This pack already allows putting designs in a pack.',
        });
      }
      targetCompanyId = collection.companyId;
      sourceCollectionId = collection.id;
    } else {
      const ownerIds = [...new Set(products.map((p) => p.companyId))];
      if (ownerIds.length !== 1) {
        throw new BadRequestException({
          code: 'MIXED_OWNER',
          message: 'Ask one business at a time.',
        });
      }
      targetCompanyId = ownerIds[0]!;
    }

    if (targetCompanyId === requesterCompanyId) {
      throw new BadRequestException({
        code: 'INVALID_TARGET',
        message: 'You already decide for these designs.',
      });
    }

    // Mill path: product allowForward open → no Ask needed.
    // Desk path: pack allow already checked; product may still be locked at mill.
    if (!sourceCollectionId) {
      for (const product of products) {
        if (product.allowForward) {
          throw new BadRequestException({
            code: 'ALREADY_ALLOWED',
            message: 'This design can already go in a pack.',
          });
        }
      }
    }

    const existingGrants = await this.prisma.productRelistGrant.findMany({
      where: {
        companyId: requesterCompanyId,
        productId: { in: uniqueIds },
      },
      select: { productId: true },
    });
    if (existingGrants.length > 0) {
      throw new ConflictException({
        code: 'ALREADY_GRANTED',
        message: 'You can already put this in a pack.',
      });
    }

    const pendingRows = await this.prisma.relistRequest.findMany({
      where: {
        requesterCompanyId,
        targetCompanyId,
        status: RelistRequestStatus.Pending,
      },
    });
    const sortedKey = [...uniqueIds].sort().join('|');
    const pending = pendingRows.find(
      (row) =>
        [...row.productIds].sort().join('|') === sortedKey &&
        (row.sourceCollectionId ?? null) === sourceCollectionId,
    );
    if (pending) {
      return this.toView(pending.id);
    }

    const threadId = await this.threads.ensureTradeThread(
      requesterCompanyId,
      targetCompanyId,
    );

    const created = await this.prisma.relistRequest.create({
      data: {
        productIds: uniqueIds,
        requesterCompanyId,
        targetCompanyId,
        sourceCollectionId,
        status: RelistRequestStatus.Pending,
        threadId,
      },
    });

    const names = products.map((p) => p.name);
    const primary = products[0]!;
    const caption =
      names.length === 1
        ? `Wants to put ${names[0]} in their pack`
        : `Wants to put ${names.length} designs in their pack`;

    const meta = {
      kind: RELIST_REQUEST_META,
      requestId: created.id,
      productIds: uniqueIds,
      productNames: names,
      status: RelistRequestStatus.Pending,
      requesterCompanyId,
      targetCompanyId,
      sourceCollectionId,
    };

    const message = await this.prisma.message.create({
      data: {
        threadId,
        senderCompanyId: requesterCompanyId,
        type: MessageType.ProductCard,
        body: caption,
        referenceId: primary.id,
        metadata: meta,
      },
    });
    await this.prisma.relistRequest.update({
      where: { id: created.id },
      data: { messageId: message.id },
    });
    await this.prisma.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });

    return this.toView(created.id);
  }

  async allow(actorCompanyId: string, requestId: string): Promise<RelistRequestView> {
    const request = await this.loadPendingForOwner(actorCompanyId, requestId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: request.productIds } },
      select: { id: true, name: true, companyId: true, allowForward: true },
    });
    const nameById = new Map(products.map((p) => [p.id, p.name]));

    await this.assertActorMayGrant(actorCompanyId, products, request.sourceCollectionId);

    for (const productId of request.productIds) {
      await this.prisma.productRelistGrant.upsert({
        where: {
          productId_companyId: {
            productId,
            companyId: request.requesterCompanyId,
          },
        },
        create: {
          productId,
          companyId: request.requesterCompanyId,
          grantedByCompanyId: actorCompanyId,
        },
        update: {
          grantedAt: new Date(),
          grantedByCompanyId: actorCompanyId,
        },
      });
    }

    const now = new Date();
    await this.prisma.relistRequest.update({
      where: { id: request.id },
      data: { status: RelistRequestStatus.Allowed, decidedAt: now },
    });

    const names = request.productIds.map((id) => nameById.get(id) ?? 'design');
    const allowedBody =
      names.length === 1
        ? `Allowed · ${names[0]}`
        : `Allowed · ${names.length} designs`;

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
          body: allowedBody,
          metadata: {
            ...prev,
            kind: RELIST_REQUEST_META,
            requestId: request.id,
            productIds: request.productIds,
            productNames: names,
            status: RelistRequestStatus.Allowed,
            requesterCompanyId: request.requesterCompanyId,
            targetCompanyId: request.targetCompanyId,
            sourceCollectionId: request.sourceCollectionId,
          },
        },
      });
    }

    if (request.threadId) {
      const grantBody =
        names.length === 1
          ? 'You can put this in your pack'
          : `You can put these ${names.length} designs in your pack`;
      await this.prisma.message.create({
        data: {
          threadId: request.threadId,
          senderCompanyId: actorCompanyId,
          type: MessageType.System,
          body: grantBody,
          referenceId: request.productIds[0] ?? null,
          metadata: {
            kind: 'relist_granted',
            side: 'company',
            companyId: request.requesterCompanyId,
            productIds: request.productIds,
            productNames: names,
          },
        },
      });
      await this.prisma.thread.update({
        where: { id: request.threadId },
        data: { lastMessageAt: now },
      });
    }

    this.events.relistGranted({
      requestId: request.id,
      productIds: request.productIds,
      productNames: names,
      requesterCompanyId: request.requesterCompanyId,
      targetCompanyId: request.targetCompanyId,
    });

    return this.toView(request.id);
  }

  async deny(actorCompanyId: string, requestId: string): Promise<{ ok: true }> {
    const request = await this.loadPendingForOwner(actorCompanyId, requestId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: request.productIds } },
      select: { id: true, name: true },
    });
    const names = request.productIds.map(
      (id) => products.find((p) => p.id === id)?.name ?? 'design',
    );
    const now = new Date();
    await this.prisma.relistRequest.update({
      where: { id: request.id },
      data: { status: RelistRequestStatus.Denied, decidedAt: now },
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
          body: `Declined · ${names[0] ?? 'design'}`,
          metadata: {
            ...prev,
            kind: RELIST_REQUEST_META,
            requestId: request.id,
            productIds: request.productIds,
            productNames: names,
            status: RelistRequestStatus.Denied,
            requesterCompanyId: request.requesterCompanyId,
            targetCompanyId: request.targetCompanyId,
            sourceCollectionId: request.sourceCollectionId,
          },
        },
      });
    }
    return { ok: true };
  }

  async listOutgoingPending(requesterCompanyId: string): Promise<RelistRequestView[]> {
    const rows = await this.prisma.relistRequest.findMany({
      where: {
        requesterCompanyId,
        status: RelistRequestStatus.Pending,
      },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(rows.map((row) => this.toView(row.id)));
  }

  async checkAccess(
    viewerCompanyId: string,
    dto: CheckRelistAccessDto,
  ): Promise<RelistAccessView> {
    const productIds = [...new Set(dto.productIds)];
    if (productIds.length === 0) {
      return { grantedProductIds: [], pendingByProductId: {}, packOpenProductIds: [] };
    }

    const grants = await this.prisma.productRelistGrant.findMany({
      where: { companyId: viewerCompanyId, productId: { in: productIds } },
      select: { productId: true },
    });
    const grantedProductIds = grants.map((g) => g.productId);

    const pending = await this.prisma.relistRequest.findMany({
      where: {
        requesterCompanyId: viewerCompanyId,
        status: RelistRequestStatus.Pending,
      },
      select: { id: true, productIds: true },
    });
    const pendingByProductId: Record<string, string> = {};
    for (const row of pending) {
      for (const productId of row.productIds) {
        if (productIds.includes(productId) && !pendingByProductId[productId]) {
          pendingByProductId[productId] = row.id;
        }
      }
    }

    const packOpenProductIds: string[] = [];
    const packByProductId = dto.packByProductId ?? {};
    const collectionIds = [...new Set(Object.values(packByProductId))];
    if (collectionIds.length > 0) {
      const collections = await this.prisma.collection.findMany({
        where: {
          id: { in: collectionIds },
          status: CollectionStatus.Published,
          allowForward: true,
        },
        select: { id: true },
      });
      const openPacks = new Set(collections.map((c) => c.id));
      for (const [productId, collectionId] of Object.entries(packByProductId)) {
        if (openPacks.has(collectionId) && productIds.includes(productId)) {
          packOpenProductIds.push(productId);
        }
      }
    }

    return { grantedProductIds, pendingByProductId, packOpenProductIds };
  }

  async listGrantsForProduct(
    ownerCompanyId: string,
    productId: string,
  ): Promise<ProductRelistGrantView[]> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId: ownerCompanyId },
      select: { id: true, name: true },
    });
    if (!product) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Design not found.' });
    }
    const grants = await this.prisma.productRelistGrant.findMany({
      where: { productId },
      include: { company: true },
      orderBy: { grantedAt: 'desc' },
    });
    return grants.map((row) => ({
      companyId: row.companyId,
      company: this.companies.toPublicSummary(row.company),
      grantedAt: row.grantedAt.toISOString(),
      productId: product.id,
      productName: product.name,
    }));
  }

  async revokeGrant(
    ownerCompanyId: string,
    productId: string,
    companyId: string,
  ): Promise<{ ok: true }> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId: ownerCompanyId },
      select: { id: true },
    });
    // Product owner may always revoke. Desk who granted may revoke their downstream.
    if (!product) {
      const grantedByMe = await this.prisma.productRelistGrant.findFirst({
        where: {
          productId,
          companyId,
          grantedByCompanyId: ownerCompanyId,
        },
        select: { id: true },
      });
      if (!grantedByMe) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Design not found.' });
      }
    }

    await this.prisma.productRelistGrant.deleteMany({
      where: { productId, companyId },
    });
    // Cascade: anyone this company Allowed further on this design.
    await this.prisma.productRelistGrant.deleteMany({
      where: { productId, grantedByCompanyId: companyId },
    });
    return { ok: true };
  }

  async listMyGrants(viewerCompanyId: string): Promise<ProductRelistGrantView[]> {
    const grants = await this.prisma.productRelistGrant.findMany({
      where: { companyId: viewerCompanyId },
      include: {
        product: { include: { company: true } },
        company: true,
      },
      orderBy: { grantedAt: 'desc' },
    });
    return grants.map((row) => ({
      companyId: row.companyId,
      company: this.companies.toPublicSummary(row.product.company),
      grantedAt: row.grantedAt.toISOString(),
      productId: row.productId,
      productName: row.product.name,
    }));
  }

  /**
   * Desk may Allow only if they own the product, mill left it open, or they still
   * hold a grant (or own the source pack they curated into).
   */
  private async assertActorMayGrant(
    actorCompanyId: string,
    products: Array<{
      id: string;
      companyId: string;
      allowForward: boolean;
    }>,
    sourceCollectionId: string | null,
  ): Promise<void> {
    const foreignLocked = products.filter(
      (p) => p.companyId !== actorCompanyId && !p.allowForward,
    );
    if (foreignLocked.length === 0) return;

    const grants = await this.prisma.productRelistGrant.findMany({
      where: {
        companyId: actorCompanyId,
        productId: { in: foreignLocked.map((p) => p.id) },
      },
      select: { productId: true },
    });
    const granted = new Set(grants.map((g) => g.productId));
    const missing = foreignLocked.filter((p) => !granted.has(p.id));
    if (missing.length === 0) return;

    if (sourceCollectionId) {
      const collection = await this.prisma.collection.findFirst({
        where: { id: sourceCollectionId, companyId: actorCompanyId },
        select: { id: true },
      });
      if (collection) {
        // Pack owner without a live mill grant cannot mint new rights.
        throw new ForbiddenException({
          code: 'RELIST_NOT_ALLOWED',
          message: "You can't allow this until the supplier allows you.",
        });
      }
    }
    throw new ForbiddenException({
      code: 'RELIST_NOT_ALLOWED',
      message: "You can't allow putting this in a pack.",
    });
  }

  private async loadPendingForOwner(actorCompanyId: string, requestId: string) {
    const request = await this.prisma.relistRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Request not found.' });
    }
    if (request.targetCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Not your request to decide.',
      });
    }
    if (request.status !== RelistRequestStatus.Pending) {
      throw new ConflictException({
        code: 'ALREADY_DECIDED',
        message: 'This ask was already decided.',
      });
    }
    return request;
  }

  private async toView(id: string): Promise<RelistRequestView> {
    const row = await this.prisma.relistRequest.findUniqueOrThrow({
      where: { id },
      include: {
        requester: true,
        target: true,
      },
    });
    const products = await this.prisma.product.findMany({
      where: { id: { in: row.productIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(products.map((p) => [p.id, p.name]));
    return {
      id: row.id,
      productIds: row.productIds,
      productNames: row.productIds.map((pid) => nameById.get(pid) ?? 'Design'),
      status: row.status,
      threadId: row.threadId,
      sourceCollectionId: row.sourceCollectionId,
      requester: this.companies.toPublicSummary(row.requester),
      target: this.companies.toPublicSummary(row.target),
      createdAt: row.createdAt.toISOString(),
      decidedAt: row.decidedAt?.toISOString() ?? null,
    };
  }
}
