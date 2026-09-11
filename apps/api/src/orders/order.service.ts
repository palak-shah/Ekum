import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import {
  JobType,
  MediaKind,
  MessageType,
  OrderChatEvent,
  OrderIntent,
  OrderKind,
  OrderLineStatus,
  OrderStatus,
  OrderTradeMode,
  OrderTrailType,
  PaymentRequestStatus,
  quoteTrailSummary,
  shortOrderLabel,
  type AmendOrderDto,
  type CancelOrderDto,
  type CreateOrderDto,
  type CreateOrdersBatchDto,
  type CreateOrdersBatchResult,
  type CreateOrdersFromPackDto,
  type CreateOrdersFromPackResult,
  type CursorPage,
  type DecideOrderLinesDto,
  type DeclineOrderDto,
  type DispatchDto,
  type ListOrdersQuery,
  type OrderView,
  type QuoteOrderDto,
  type MillPassHoldDto,
  type OrderMillDeskView,
  type MillRevealDto,
  type OrderTicketDto,
  type SendUpOrderDto,
  type SettleOrderDto,
  TradeLaneTicket,
} from '@ekum/domain-types';
import { matchParentItemId, shouldPassThrough, traderListHidesSubset, allReleasedSubsetsComplete } from './i-handle-desk';
import { buyerSafePassThroughSummary } from './i-handle-soft-hide';
import { shouldRouteToTrio, effectivePathFromLane, isReleasedMillSubset, manageParentOpenChatThreadId } from './trade-lane';
import { millLaneVisibleToBuyer } from './mill-desk-visibility';
import type { Env } from '../core/config/config.schema';
import { PrismaService } from '../core/prisma/prisma.service';
import { cursorArgs, toCursorPage } from '../discovery/pagination';
import { createdAtRangeFilter } from '../common/audit';
import { JobQueue } from '../jobs/job-queue.service';
import { ThreadService } from '../conversation/thread.service';
import { resolveTradePresence } from '../identity/trade-presence';
import { OrderSerializer } from './order.serializer';
import { OrderTrailService } from './order-trail.service';
import { resolveNoteVoiceFields } from './note-voice';
import { TradeAccess } from './trade-access';
import { DomainEvents } from '../events/events.module';
import { isHeldFromSupplier } from './orderHold';

const ORDER_RELATIONS = {
  buyer: true,
  seller: true,
  items: true,
  createdByUser: { select: { id: true, name: true } },
  updatedByUser: { select: { id: true, name: true } },
  quotedByUser: { select: { id: true, name: true } },
  confirmedByUser: { select: { id: true, name: true } },
  deliveredByUser: { select: { id: true, name: true } },
  settledByUser: { select: { id: true, name: true } },
  shipments: {
    orderBy: { dispatchedAt: 'desc' as const },
    include: {
      dispatchedByUser: { select: { id: true, name: true } },
      items: { include: { orderItem: { select: { id: true, name: true } } } },
    },
  },
} as const;

const DAY_MS = 86_400_000;

type CreateOrderOptions = {
  tradeMode?: string;
  facilitatorCompanyId?: string | null;
  downstreamOrderId?: string | null;
  allowForeignProducts?: boolean;
  /** Linked mill hop — skip mill thread/notify until Send. */
  holdUntilSend?: boolean;
  /** Internal recreate after ticket flip — do not re-resolve lane. */
  skipLanePlace?: boolean;
};

/** Chat body for line decisions — omit zero counts; Order # lives on the card title. */
export function linesDecidedNotice(
  actorLabel: string,
  confirmed: number,
  declined: number,
): string {
  const parts: string[] = [];
  if (confirmed > 0) parts.push(`confirmed ${confirmed}`);
  if (declined > 0) parts.push(`declined ${declined}`);
  const action = parts.length > 0 ? parts.join(' · ') : 'updated lines';
  return `${actorLabel} ${action}`;
}

interface TransitionOptions {
  actor: 'buyer' | 'seller';
  from: string[];
  next: string;
  data?: Prisma.OrderUncheckedUpdateInput;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly serializer: OrderSerializer,
    private readonly tradeAccess: TradeAccess,
    private readonly events: DomainEvents,
    private readonly config: ConfigService<Env, true>,
    private readonly jobs: JobQueue,
    private readonly threads: ThreadService,
    private readonly trail: OrderTrailService,
  ) {}

  async create(
    actorCompanyId: string,
    userId: string,
    dto: CreateOrderDto,
    options: CreateOrderOptions = {},
  ): Promise<OrderView> {
    if (
      !options.downstreamOrderId &&
      options.tradeMode !== OrderTradeMode.Manage &&
      !options.skipLanePlace
    ) {
      dto = await this.applyTradeLanePlacePath(actorCompanyId, dto);
    }
    const handlePath =
      dto.orderPathPreference === 'handle' && !options.downstreamOrderId;
    if (handlePath) {
      const settings = await this.prisma.companySettings.findUnique({
        where: { companyId: dto.sellerCompanyId },
        select: { tradeDefaults: true },
      });
      if (!resolveTradePresence(settings?.tradeDefaults).trading) {
        throw new BadRequestException({
          code: 'TRADING_REQUIRED',
          message: 'Turn on Trading in Profile to handle this order.',
        });
      }
      options = {
        ...options,
        allowForeignProducts: true,
        tradeMode: OrderTradeMode.Manage,
        facilitatorCompanyId: undefined,
      };
    }

    await this.tradeAccess.assertCanTrade(actorCompanyId, dto.sellerCompanyId, {
      productIds: dto.items
        .map((item) => item.productId)
        .filter((id): id is string => Boolean(id)),
    });
    const items = await this.snapshotItems(dto, {
      allowForeignProducts: options.allowForeignProducts === true,
    });

    const resolvedOpts = await this.resolveFacilitatorOptions(
      actorCompanyId,
      dto.sellerCompanyId,
      handlePath ? undefined : dto.facilitatorCompanyId,
      options,
    );

    const intent = dto.intent ?? OrderIntent.Order;
    const inquiry = intent === OrderIntent.Inquiry;
    const tradeMode = resolvedOpts.tradeMode ?? OrderTradeMode.Bilateral;
    const noteVoice = await this.noteVoiceCreateFields(actorCompanyId, dto);
    const order = await this.prisma.order.create({
      data: {
        kind: dto.kind,
        intent,
        status: OrderStatus.Requested,
        tradeMode,
        facilitatorCompanyId: resolvedOpts.facilitatorCompanyId ?? null,
        downstreamOrderId: resolvedOpts.downstreamOrderId ?? null,
        upstreamReleasedAt:
          resolvedOpts.holdUntilSend && resolvedOpts.downstreamOrderId ? null : undefined,
        buyerCompanyId: actorCompanyId,
        sellerCompanyId: dto.sellerCompanyId,
        createdByCompanyId: actorCompanyId,
        createdByUserId: userId,
        updatedByUserId: userId,
        note: dto.note ?? null,
        ...noteVoice,
        items: { create: items },
      },
      include: ORDER_RELATIONS,
    });

    const held = Boolean(resolvedOpts.holdUntilSend && resolvedOpts.downstreamOrderId);
    let threadId: string | null = null;
    let livingMessageId: string | null = null;
    if (!held) {
      threadId = await this.threads.ensureTradeThread(actorCompanyId, dto.sellerCompanyId);
      const orderLabel = shortOrderLabel(order.id, { inquiry });
      const actorLabel = order.buyer.name;
      const event = inquiry ? OrderChatEvent.RateRequested : OrderChatEvent.OrderRequested;
      livingMessageId = await this.upsertOrderThreadMessage(
        actorCompanyId,
        dto.sellerCompanyId,
        actorCompanyId,
        dto.note ?? (inquiry ? `${actorLabel} asked for rates` : `${actorLabel} requested`),
        order.id,
        {
          status: order.status,
          itemCount: order.items.length,
          event,
          orderLabel,
          actorLabel,
          actorRole: 'buyer',
          intent,
          ...(noteVoice.noteVoiceUrl
            ? {
                noteVoiceUrl: noteVoice.noteVoiceUrl,
                noteVoiceMediaId: noteVoice.noteVoiceMediaId,
                noteVoiceDurationMs: noteVoice.noteVoiceDurationMs,
              }
            : {}),
        },
        MessageType.OrderCard,
      );

      this.events.orderCreated({
        orderId: order.id,
        buyerCompanyId: order.buyerCompanyId,
        sellerCompanyId: order.sellerCompanyId,
        facilitatorCompanyId: order.facilitatorCompanyId,
      });
    }

    if (handlePath) {
      await this.spawnHandleUpstreams(dto.sellerCompanyId, userId, order.id, dto);
    }

    await this.trail.append({
      orderId: order.id,
      type: OrderTrailType.Requested,
      at: order.createdAt,
      actorCompanyId,
      actorUserId: userId,
      note: dto.note?.trim() || null,
      noteVoiceMediaId: noteVoice.noteVoiceMediaId,
      noteVoiceUrl: noteVoice.noteVoiceUrl,
      noteVoiceDurationMs: noteVoice.noteVoiceDurationMs,
    });

    return this.serializer.toOrderView(order, actorCompanyId, threadId, livingMessageId);
  }

  /**
   * One buyer gesture over mixed suppliers → N orders (one per product.companyId).
   * Always returns structured successes + failures (HTTP 200 at the controller).
   */
  async createBatch(
    actorCompanyId: string,
    userId: string,
    dto: CreateOrdersBatchDto,
  ): Promise<CreateOrdersBatchResult> {
    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        companyId: true,
        company: { select: { name: true } },
      },
    });
    const byId = new Map(products.map((product) => [product.id, product]));

    const unknownIds = productIds.filter((id) => !byId.has(id));
    const groups = new Map<
      string,
      {
        sellerName: string | null;
        items: CreateOrdersBatchDto['items'];
      }
    >();

    for (const item of dto.items) {
      const product = byId.get(item.productId);
      if (!product) continue;
      const bucket = groups.get(product.companyId) ?? {
        sellerName: product.company.name,
        items: [],
      };
      bucket.items.push(item);
      groups.set(product.companyId, bucket);
    }

    const orders: OrderView[] = [];
    const failures: CreateOrdersBatchResult['failures'] = [];

    if (unknownIds.length > 0) {
      failures.push({
        sellerCompanyId: 'unknown',
        sellerName: null,
        productIds: unknownIds,
        code: 'INVALID_ITEM',
        message: 'One or more designs could not be found.',
      });
    }

    for (const [sellerCompanyId, group] of groups) {
      try {
        const createOpts =
          dto.facilitatorCompanyId &&
          dto.facilitatorCompanyId !== actorCompanyId &&
          dto.facilitatorCompanyId !== sellerCompanyId
            ? {
                tradeMode: OrderTradeMode.Direct,
                facilitatorCompanyId: dto.facilitatorCompanyId,
              }
            : {};
        if (createOpts.facilitatorCompanyId) {
          const settings = await this.prisma.companySettings.findUnique({
            where: { companyId: createOpts.facilitatorCompanyId },
            select: { tradeDefaults: true },
          });
          if (!resolveTradePresence(settings?.tradeDefaults).trading) {
            throw new BadRequestException({
              code: 'TRADING_REQUIRED',
              message: 'Turn on Trading in Profile to stay in the loop on orders.',
            });
          }
        }
        const order = await this.create(
          actorCompanyId,
          userId,
          {
            sellerCompanyId,
            kind: dto.kind ?? OrderKind.Standard,
            intent: dto.intent ?? OrderIntent.Order,
            note: dto.note,
            items: group.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              images: item.images ?? [],
              note: item.note,
              unit: item.unit,
              name: item.name,
            })),
          },
          createOpts,
        );
        orders.push(order);
      } catch (err) {
        failures.push({
          sellerCompanyId,
          sellerName: group.sellerName,
          productIds: group.items.map((item) => item.productId),
          code: exceptionCode(err),
          message: exceptionMessage(err, 'Could not place the order.'),
        });
      }
    }

    return { orders, failures };
  }

  /**
   * Curated pack → Manage downstream (buyer↔trader) + linked upstream per supplier.
   */
  async createFromPack(
    actorCompanyId: string,
    userId: string,
    dto: CreateOrdersFromPackDto,
  ): Promise<CreateOrdersFromPackResult> {
    const collection = await this.prisma.collection.findUnique({
      where: { id: dto.collectionId },
      select: {
        id: true,
        companyId: true,
        orderPathPreference: true,
        company: { select: { settings: { select: { tradeDefaults: true } } } },
        products: { select: { productId: true } },
      },
    });
    if (!collection) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
    }

    const memberIds = new Set(collection.products.map((row) => row.productId));
    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    for (const id of productIds) {
      if (!memberIds.has(id)) {
        throw new BadRequestException({
          code: 'NOT_IN_PACK',
          message: 'One or more designs are not in this pack.',
        });
      }
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        companyId: true,
        company: { select: { name: true } },
      },
    });
    if (products.length !== productIds.length) {
      throw new NotFoundException({
        code: 'INVALID_ITEM',
        message: 'One or more designs could not be found.',
      });
    }

    const hasForeign = products.some((product) => product.companyId !== collection.companyId);
    if (!hasForeign) {
      throw new BadRequestException({
        code: 'NOT_CURATED',
        message:
          'This album is only the seller’s own designs — not a curated pack. Place Order again as a normal order to them.',
      });
    }

    const traderPresence = resolveTradePresence(collection.company.settings?.tradeDefaults);
    if (!traderPresence.trading) {
      throw new BadRequestException({
        code: 'TRADING_REQUIRED',
        message: 'This business is not taking pack orders right now.',
      });
    }

    await this.tradeAccess.assertCanTrade(actorCompanyId, collection.companyId, { productIds });

    // Manage via options only — do not stamp orderPathPreference: 'handle' or
    // create() would also spawnHandleUpstreams and double every mill card.
    const downstream = await this.create(
      actorCompanyId,
      userId,
      {
        sellerCompanyId: collection.companyId,
        kind: dto.kind ?? OrderKind.Standard,
        intent: dto.intent ?? OrderIntent.Order,
        note: dto.note,
        items: dto.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          images: item.images ?? [],
          note: item.note,
          unit: item.unit,
          name: item.name,
        })),
      },
      { tradeMode: OrderTradeMode.Manage, allowForeignProducts: true },
    );

    const groups = new Map<
      string,
      { sellerName: string | null; items: CreateOrdersFromPackDto['items'] }
    >();
    const byId = new Map(products.map((product) => [product.id, product]));
    for (const item of dto.items) {
      const product = byId.get(item.productId)!;
      const bucket = groups.get(product.companyId) ?? {
        sellerName: product.company.name,
        items: [],
      };
      bucket.items.push(item);
      groups.set(product.companyId, bucket);
    }

    const upstreams: OrderView[] = [];
    const failures: CreateOrdersFromPackResult['failures'] = [];
    const shortId = downstream.id.slice(-6).toUpperCase();

    for (const [sellerCompanyId, group] of groups) {
      try {
        await this.upsertTradeLane(
          collection.companyId,
          sellerCompanyId,
          actorCompanyId,
        );
        const upstream = await this.create(
          collection.companyId,
          userId,
          {
            sellerCompanyId,
            kind: dto.kind ?? OrderKind.Standard,
            intent: dto.intent ?? OrderIntent.Order,
            note: dto.note ? `${dto.note} (for #${shortId})` : `For order #${shortId}`,
            items: group.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              images: item.images ?? [],
              note: item.note,
              unit: item.unit,
              name: item.name,
            })),
          },
          { downstreamOrderId: downstream.id, holdUntilSend: true },
        );
        upstreams.push(upstream);
      } catch (err) {
        failures.push({
          sellerCompanyId,
          sellerName: group.sellerName,
          productIds: group.items.map((item) => item.productId),
          code: exceptionCode(err),
          message: exceptionMessage(err, 'Could not place the upstream order.'),
        });
      }
    }

    return { downstream, upstreams, failures };
  }

  /**
   * Buyer replaces lines while the seller has not quoted/confirmed/declined.
   * Appends an Updated chat card; never patches older cards.
   */
  async amend(
    actorCompanyId: string,
    userId: string,
    id: string,
    dto: AmendOrderDto,
  ): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    if (!(await this.buyerCanAmend(order, actorCompanyId))) {
      if (order.buyerCompanyId !== actorCompanyId) {
        throw new ForbiddenException({
          code: 'NOT_ALLOWED',
          message: 'Only the buyer can edit this.',
        });
      }
      if (order.kind === OrderKind.Photo) {
        throw new BadRequestException({
          code: 'NOT_SUPPORTED',
          message: 'Photo orders cannot be edited this way. Cancel and place a new one.',
        });
      }
      throw new ConflictException({
        code: 'SELLER_PROGRESS',
        message: 'This can only be edited before the seller responds.',
      });
    }

    const inquiry = order.intent === OrderIntent.Inquiry;
    const snapshots = await this.snapshotItems(
      {
        sellerCompanyId: order.sellerCompanyId,
        kind: OrderKind.Standard,
        intent: order.intent as CreateOrderDto['intent'],
        items: dto.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          images: item.images ?? [],
          note: item.note,
          unit: item.unit,
          name: item.name,
        })),
      },
      {
        // I-handle: lines are mill designs; seller is the trader.
        allowForeignProducts: order.tradeMode === OrderTradeMode.Manage,
      },
    );
    await this.prisma.order.update({
      where: { id },
      data: {
        amendCount: { increment: 1 },
        note: dto.note !== undefined ? dto.note : undefined,
        items: {
          deleteMany: {},
          create: snapshots,
        },
        ...this.withActor(userId),
      },
    });

    const refreshed = await this.loadForParty(id, actorCompanyId);
    const orderLabel = shortOrderLabel(id, { inquiry });
    const actorLabel = order.buyer.name;
    await this.postOrderCard(
      order.buyerCompanyId,
      order.sellerCompanyId,
      actorCompanyId,
      dto.note ??
        `${actorLabel} updated · ${refreshed.items.length} design${refreshed.items.length === 1 ? '' : 's'}`,
      id,
      {
        status: OrderStatus.Requested,
        itemCount: refreshed.items.length,
        event: OrderChatEvent.OrderUpdated,
        orderLabel,
        actorLabel,
        actorRole: 'buyer',
        intent: order.intent,
      },
    );

    await this.trail.append({
      orderId: id,
      type: OrderTrailType.Updated,
      actorCompanyId,
      actorUserId: userId,
      detail: `${refreshed.items.length} design${refreshed.items.length === 1 ? '' : 's'}`,
      note: dto.note?.trim() || null,
      ...(await this.trailVoiceFields(actorCompanyId, dto)),
    });

    const threadId = await this.threads.findDirectThreadId(
      order.buyerCompanyId,
      order.sellerCompanyId,
    );
    await this.passBuyerAmendToMills(id);
    return {
      ...this.serializer.toOrderView(refreshed, actorCompanyId, threadId),
      canAmend: true,
    };
  }

  async list(actorCompanyId: string, query: ListOrdersQuery): Promise<CursorPage<OrderView>> {
    const createdAt = createdAtRangeFilter(query);
    const partyWhere: Prisma.OrderWhereInput =
      query.direction === 'buying'
        ? { buyerCompanyId: actorCompanyId }
        : query.direction === 'selling'
          ? { sellerCompanyId: actorCompanyId }
          : {
              OR: [
                { buyerCompanyId: actorCompanyId },
                { sellerCompanyId: actorCompanyId },
                { facilitatorCompanyId: actorCompanyId },
              ],
            };
    const filters: Prisma.OrderWhereInput[] = [partyWhere];
    if (query.status) filters.push({ status: query.status });
    if (query.tradeMode) filters.push({ tradeMode: query.tradeMode });
    if (createdAt) filters.push({ createdAt });
    if (query.q?.trim()) {
      const q = query.q.trim();
      filters.push({
        OR: [
          { id: { contains: q, mode: 'insensitive' } },
          { buyer: { name: { contains: q, mode: 'insensitive' } } },
          { seller: { name: { contains: q, mode: 'insensitive' } } },
          {
            items: {
              some: {
                OR: [
                  { name: { contains: q, mode: 'insensitive' } },
                  { sku: { contains: q, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      });
    }
    filters.push({
      NOT: {
        sellerCompanyId: actorCompanyId,
        downstreamOrderId: { not: null },
        upstreamReleasedAt: null,
      },
    });
    filters.push({
      NOT: traderListHidesSubset(actorCompanyId),
    });
    const listWhere: Prisma.OrderWhereInput =
      filters.length === 1 ? filters[0]! : { AND: filters };

    let rows = await this.prisma.order.findMany({
      where: listWhere,
      include: ORDER_RELATIONS,
      ...cursorArgs(query),
    });
    const q = query.q?.trim();
    if (q) {
      const idNeedle = q.replace(/^#/, '');
      const hops = await this.prisma.order.findMany({
        where: {
          buyerCompanyId: actorCompanyId,
          downstreamOrderId: { not: null },
          OR: [
            { id: { contains: idNeedle, mode: 'insensitive' } },
            { seller: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        select: { downstreamOrderId: true },
      });
      const extraIds = [
        ...new Set(
          hops
            .map((hop) => hop.downstreamOrderId)
            .filter((id): id is string => Boolean(id) && !rows.some((row) => row.id === id)),
        ),
      ];
      if (extraIds.length > 0) {
        const extra = await this.prisma.order.findMany({
          where: { id: { in: extraIds } },
          include: ORDER_RELATIONS,
        });
        rows = [...extra, ...rows];
      }
    }
    const quotedIds = await this.orderIdsWithSellerQuote(rows);
    const needsQuotePassIds = await this.parentIdsNeedingQuotePass(rows, actorCompanyId, quotedIds);
    const linkedByParent = await this.linkedMillsByParent(rows, actorCompanyId);
    const healedIds = await this.healManageParentsInList(rows);
    if (healedIds.size > 0) {
      const refreshed = await this.prisma.order.findMany({
        where: { id: { in: [...healedIds] } },
        include: ORDER_RELATIONS,
      });
      const byId = new Map(refreshed.map((row) => [row.id, row]));
      rows = rows.map((row) => byId.get(row.id) ?? row);
    }
    return toCursorPage(rows, query.limit, (row) => {
      const sellerQuoted = quotedIds.has(row.id);
      return {
        ...this.serializer.toOrderView(row, actorCompanyId),
        hasSellerQuote: sellerQuoted,
        canAcceptQuote: this.buyerCanAcceptQuoteSync(row, actorCompanyId, sellerQuoted),
        needsQuotePass: needsQuotePassIds.has(row.id),
        linkedMills: linkedByParent.get(row.id) ?? [],
      };
    });
  }

  async get(actorCompanyId: string, id: string): Promise<OrderView> {
    let order = await this.loadForParty(id, actorCompanyId, true);
    if (await this.healManageParentIfSubsetsComplete(order)) {
      order = await this.loadForParty(id, actorCompanyId, true);
    }
    const millDesks = await this.buildMillDesks(order, actorCompanyId);
    const firstReveal = millDesks.find((desk) => desk.reveal && desk.revealThreadId)?.revealThreadId;
    const directThreadId = await this.threads.findDirectThreadId(
      order.buyerCompanyId,
      order.sellerCompanyId,
    );
    const threadId = manageParentOpenChatThreadId(directThreadId, firstReveal);
    const view = this.serializer.toOrderView(order, actorCompanyId, threadId);
    const sellerQuoted = await this.hasSellerQuote(order.id, order.sellerCompanyId);
    const relatedOrders = await this.buildRelatedOrders(order, actorCompanyId);
    const canSendUp =
      order.sellerCompanyId === actorCompanyId &&
      order.tradeMode === OrderTradeMode.Manage &&
      relatedOrders.some((related) => related.role === 'upstream' && related.held);
    const canTakeControl =
      order.tradeMode === OrderTradeMode.Direct &&
      order.facilitatorCompanyId === actorCompanyId &&
      order.status === OrderStatus.Requested &&
      !sellerQuoted &&
      order.items.every((item) => item.lineStatus === OrderLineStatus.Open);
    const paymentRequests = (
      await this.prisma.paymentRequest.findMany({
        where: { orderId: id },
        orderBy: { createdAt: 'desc' },
      })
    ).map((row) => ({
      id: row.id,
      orderId: row.orderId,
      amount: row.amount.toNumber(),
      note: row.note,
      noteVoiceUrl: row.noteVoiceUrl,
      noteVoiceDurationMs: row.noteVoiceDurationMs,
      instructions: row.instructions,
      status: row.status,
      seenAt: row.seenAt ? row.seenAt.toISOString() : null,
      paidAt: row.paidAt ? row.paidAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    }));
    const quoteNoteFields = sellerQuoted
      ? await this.loadQuoteNoteFields(order.id)
      : {
          quoteNote: null,
          quoteNoteVoiceUrl: null,
          quoteNoteVoiceDurationMs: null,
        };
    return {
      ...view,
      relatedOrders,
      millDesks,
      deskOrderId:
        order.buyerCompanyId === actorCompanyId && order.downstreamOrderId
          ? order.downstreamOrderId
          : null,
      needsQuotePass:
        millDesks.some((desk) => desk.millQuoted && !desk.held) && !sellerQuoted,
      linkedMills: millDesks.map((desk) => ({
        name: desk.sellerName,
        orderId: desk.upstreamOrderId,
      })),
      canSendUp,
      canTakeControl,
      canFlipTicket: Boolean(
        canTakeControl ||
          (order.tradeMode === OrderTradeMode.Manage &&
            order.sellerCompanyId === actorCompanyId &&
            order.status === OrderStatus.Requested &&
            !sellerQuoted &&
            order.items.every((item) => item.lineStatus === OrderLineStatus.Open) &&
            millDesks.length > 0),
      ),
      laneTicket:
        order.tradeMode === OrderTradeMode.Direct && order.facilitatorCompanyId
          ? 'mill'
          : order.tradeMode === OrderTradeMode.Manage &&
              (order.sellerCompanyId === actorCompanyId || order.buyerCompanyId === actorCompanyId)
            ? millDesks.length > 0 && millDesks.every((desk) => desk.ticket === 'mill')
              ? 'mill'
              : 'me'
            : null,
      canAmend: await this.buyerCanAmend(order, actorCompanyId),
      hasSellerQuote: sellerQuoted,
      canAcceptQuote: this.buyerCanAcceptQuoteSync(order, actorCompanyId, sellerQuoted),
      createdBySeller: order.createdByCompanyId === order.sellerCompanyId,
      canAcceptLogged:
        order.buyerCompanyId === actorCompanyId &&
        order.status === OrderStatus.Requested &&
        order.createdByCompanyId === order.sellerCompanyId,
      paymentRequests,
      canAskPayment:
        order.sellerCompanyId === actorCompanyId &&
        (order.status === OrderStatus.Confirmed ||
          order.status === OrderStatus.PartShipped ||
          order.status === OrderStatus.Dispatched ||
          order.status === OrderStatus.Delivered ||
          order.status === OrderStatus.Settled) &&
        !paymentRequests.some((ask) => ask.status === PaymentRequestStatus.Open),
      ...quoteNoteFields,
      canSettle:
        order.sellerCompanyId === actorCompanyId &&
        millDesks.length === 0 &&
        (order.status === OrderStatus.Confirmed ||
          order.status === OrderStatus.PartShipped) &&
        Boolean(view.partiallyShipped),
      trail: await this.trail.listForViewer(order.id, actorCompanyId, {
        buyerName: order.buyer.name,
        sellerName: order.seller.name,
        buyerCompanyId: order.buyerCompanyId,
        sellerCompanyId: order.sellerCompanyId,
        upstreamNamesToHide: (
          await this.upstreamSellerNames(order)
        ).filter(
          (name) => !millDesks.some((desk) => desk.sellerName === name),
        ),
        staffByUserId: new Map(
          [
            order.createdByUser,
            order.quotedByUser,
            order.confirmedByUser,
            order.deliveredByUser,
            order.settledByUser,
            order.updatedByUser,
          ]
            .filter(Boolean)
            .map((u) => [u!.id, u!.name?.trim() || ''] as const)
            .filter(([, name]) => Boolean(name)),
        ),
      }),
    };
  }

  /** Quote text/voice live on the living rate card metadata — surface on order detail. */
  private async loadQuoteNoteFields(orderId: string): Promise<{
    quoteNote: string | null;
    quoteNoteVoiceUrl: string | null;
    quoteNoteVoiceDurationMs: number | null;
  }> {
    const row = await this.prisma.message.findFirst({
      where: {
        referenceId: orderId,
        OR: [
          { type: MessageType.Rate },
          {
            type: { in: [MessageType.Rate, MessageType.OrderCard] },
            metadata: { path: ['quoted'], equals: true },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { body: true, metadata: true },
    });
    if (!row) {
      return {
        quoteNote: null,
        quoteNoteVoiceUrl: null,
        quoteNoteVoiceDurationMs: null,
      };
    }
    const meta =
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : null;
    const body = row.body?.trim() || '';
    const quoteNote =
      body && !/^Quote\b/i.test(body) ? body : null;
    return {
      quoteNote,
      quoteNoteVoiceUrl:
        typeof meta?.noteVoiceUrl === 'string' ? meta.noteVoiceUrl : null,
      quoteNoteVoiceDurationMs:
        typeof meta?.noteVoiceDurationMs === 'number' ? meta.noteVoiceDurationMs : null,
    };
  }

  async confirm(actorCompanyId: string, userId: string, id: string): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    if (order.sellerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only the seller can do this.',
      });
    }
    if (order.status !== OrderStatus.Requested) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: `An order that is ${order.status} cannot move to ${OrderStatus.Confirmed}.`,
      });
    }

    const openIds = order.items
      .filter((item) => item.lineStatus === OrderLineStatus.Open)
      .map((item) => item.id);
    if (openIds.length === 0) {
      throw new ConflictException({
        code: 'NO_OPEN_LINES',
        message: 'There are no open lines left to confirm.',
      });
    }

    await this.prisma.$transaction([
      this.prisma.orderItem.updateMany({
        where: { id: { in: openIds } },
        data: { lineStatus: OrderLineStatus.Confirmed },
      }),
      this.prisma.order.update({
        where: { id },
        data: {
          status: OrderStatus.Confirmed,
          confirmedAt: new Date(),
          confirmedByCompanyId: actorCompanyId,
          confirmedByUserId: userId,
          ...this.firmInquiryData(order.intent),
          ...this.withActor(userId),
        },
      }),
    ]);

    const orderLabel = shortOrderLabel(id);
    const actorLabel = order.seller.name;
    await this.postOrderCard(
      order.buyerCompanyId,
      order.sellerCompanyId,
      actorCompanyId,
      `${actorLabel} confirmed ${openIds.length} design${openIds.length === 1 ? '' : 's'}`,
      id,
      {
        status: OrderStatus.Confirmed,
        itemCount: openIds.length,
        confirmedCount: openIds.length,
        declinedCount: 0,
        kind: 'order_lines',
        event: OrderChatEvent.LinesDecided,
        orderLabel,
        actorLabel,
        actorRole: 'seller',
      },
    );
    await this.trail.append({
      orderId: id,
      type: OrderTrailType.Confirmed,
      actorCompanyId,
      actorUserId: userId,
      detail: `${openIds.length} design${openIds.length === 1 ? '' : 's'}`,
    });
    await this.passMillLinesToParent(id, actorCompanyId, userId);
    return this.emitAndGet(actorCompanyId, id, OrderStatus.Confirmed);
  }

  async acceptQuote(actorCompanyId: string, userId: string, id: string): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    if (order.buyerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only the buyer can do this.',
      });
    }
    if (order.status !== OrderStatus.Requested) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: `An order that is ${order.status} cannot move to ${OrderStatus.Confirmed}.`,
      });
    }

    const sellerQuoted = await this.hasSellerQuote(order.id, order.sellerCompanyId);
    if (!sellerQuoted) {
      throw new ConflictException({
        code: 'NO_QUOTE',
        message: 'Seller has not sent a quote yet.',
      });
    }

    const openWithRate = order.items.filter(
      (item) => item.lineStatus === OrderLineStatus.Open && item.rate != null,
    );
    if (openWithRate.length === 0) {
      throw new ConflictException({
        code: 'NO_QUOTE',
        message: 'There is no quote to accept on open lines.',
      });
    }

    await this.prisma.$transaction([
      this.prisma.orderItem.updateMany({
        where: { id: { in: openWithRate.map((item) => item.id) } },
        data: { lineStatus: OrderLineStatus.Confirmed },
      }),
      this.prisma.order.update({
        where: { id },
        data: {
          status: OrderStatus.Confirmed,
          confirmedAt: new Date(),
          confirmedByCompanyId: actorCompanyId,
          confirmedByUserId: userId,
          ...this.firmInquiryData(order.intent),
          ...this.withActor(userId),
        },
      }),
    ]);

    const orderLabel = shortOrderLabel(id);
    const actorLabel = order.buyer.name;
    await this.postOrderCard(
      order.buyerCompanyId,
      order.sellerCompanyId,
      actorCompanyId,
      `${actorLabel} accepted quote`,
      id,
      {
        status: OrderStatus.Confirmed,
        itemCount: openWithRate.length,
        event: OrderChatEvent.QuoteAccepted,
        orderLabel,
        actorLabel,
        actorRole: 'buyer',
      },
    );
    await this.trail.append({
      orderId: id,
      type: OrderTrailType.Confirmed,
      actorCompanyId,
      actorUserId: userId,
      detail: 'Quote accepted',
    });
    await this.passBuyerAcceptToMills(id, userId);
    return this.emitAndGet(actorCompanyId, id, OrderStatus.Confirmed);
  }

  async quote(actorCompanyId: string, userId: string, id: string, dto: QuoteOrderDto): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    if (order.sellerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only the seller can send a quote.',
      });
    }
    if (order.status !== OrderStatus.Requested) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: 'Only a requested order can be quoted.',
      });
    }

    const byId = new Map(order.items.map((item) => [item.id, item]));
    const lines = [...dto.items];
    const quotedIds = new Set(lines.map((line) => line.orderItemId));
    for (const line of lines) {
      const item = byId.get(line.orderItemId);
      if (!item) {
        throw new NotFoundException({
          code: 'INVALID_ITEM',
          message: 'A quote line does not match this order.',
        });
      }
      if (item.lineStatus === OrderLineStatus.Declined) {
        throw new ConflictException({
          code: 'LINE_DECLINED',
          message: 'A declined line cannot be quoted again.',
        });
      }
    }

    // Any open line not in the quote payload is treated as unavailable.
    for (const item of order.items) {
      if (item.lineStatus === OrderLineStatus.Open && !quotedIds.has(item.id)) {
        lines.push({ orderItemId: item.id, unavailable: true });
      }
    }

    const supplyable = lines.filter((line) => !line.unavailable);
    if (supplyable.length < 1) {
      throw new BadRequestException({
        code: 'EMPTY_QUOTE',
        message: 'Quote at least one design, or decline the whole order.',
      });
    }

    for (const line of lines) {
      const item = byId.get(line.orderItemId)!;
      if (line.unavailable) {
        await this.prisma.orderItem.update({
          where: { id: item.id },
          data: { lineStatus: OrderLineStatus.Declined },
        });
        continue;
      }
      const nextQty = line.quantity ?? item.quantity.toNumber();
      const requested = item.requestedQuantity.toNumber();
      if (nextQty > requested) {
        throw new BadRequestException({
          code: 'QTY_TOO_HIGH',
          message: 'Offer quantity cannot exceed the requested quantity.',
        });
      }
      await this.prisma.orderItem.update({
        where: { id: item.id },
        data: {
          rate: line.rate!,
          quantity: nextQty,
          lineStatus: OrderLineStatus.Open,
        },
      });
    }

    const total = supplyable.reduce((sum, line) => {
      const item = byId.get(line.orderItemId);
      const qty = line.quantity ?? item?.quantity.toNumber() ?? 0;
      return sum + (line.rate ?? 0) * qty;
    }, 0);
    const declinedCount = lines.filter((line) => line.unavailable).length;
    const partial = declinedCount > 0 || supplyable.some((line) => {
      const item = byId.get(line.orderItemId);
      const offered = line.quantity ?? item?.quantity.toNumber() ?? 0;
      return offered < (item?.requestedQuantity.toNumber() ?? offered);
    });

    const voice = await this.noteVoiceMetadata(actorCompanyId, dto);
    await this.upsertOrderThreadMessage(
      order.buyerCompanyId,
      order.sellerCompanyId,
      actorCompanyId,
      dto.note ??
        (partial
          ? `Quote · ${supplyable.length} of ${order.items.length} designs`
          : 'Quote'),
      order.id,
      {
        status: OrderStatus.Requested,
        itemCount: supplyable.length,
        totalLabel: `₹${total.toLocaleString('en-IN')}`,
        validUntil: dto.validUntil ?? null,
        quoted: true,
        partial,
        event: OrderChatEvent.QuoteSent,
        orderLabel: shortOrderLabel(order.id),
        actorLabel: order.seller.name,
        actorRole: 'seller',
        ...voice,
      },
      MessageType.Rate,
    );

    if (order.intent === OrderIntent.Inquiry) {
      await this.prisma.order.update({
        where: { id },
        data: {
          intent: OrderIntent.Order,
          ...(order.quotedByUserId
            ? {}
            : { quotedByUserId: userId, quotedAt: new Date() }),
          ...this.withActor(userId),
        },
      });
    } else {
      await this.prisma.order.update({
        where: { id },
        data: {
          ...(order.quotedByUserId
            ? {}
            : { quotedByUserId: userId, quotedAt: new Date() }),
          ...this.withActor(userId),
        },
      });
    }

    await this.trail.append({
      orderId: id,
      type: OrderTrailType.Quoted,
      actorCompanyId,
      actorUserId: userId,
      summary: quoteTrailSummary(total, Boolean(order.quotedAt)),
      detail: partial
        ? `${supplyable.length} of ${order.items.length} designs`
        : undefined,
      note: dto.note?.trim() || null,
      noteVoiceMediaId: typeof voice.noteVoiceMediaId === 'string' ? voice.noteVoiceMediaId : null,
      noteVoiceUrl: typeof voice.noteVoiceUrl === 'string' ? voice.noteVoiceUrl : null,
      noteVoiceDurationMs:
        typeof voice.noteVoiceDurationMs === 'number' ? voice.noteVoiceDurationMs : null,
    });

    return this.get(actorCompanyId, id);
  }

  async decideLines(
    actorCompanyId: string,
    userId: string,
    id: string,
    dto: DecideOrderLinesDto,
  ): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    if (order.sellerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only the seller can do this.',
      });
    }
    if (order.status !== OrderStatus.Requested) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: 'Lines can only be decided while the order is requested.',
      });
    }

    const byId = new Map(order.items.map((item) => [item.id, item]));
    let confirmed = 0;
    let declined = 0;

    for (const line of dto.items) {
      const item = byId.get(line.orderItemId);
      if (!item) {
        throw new NotFoundException({
          code: 'INVALID_ITEM',
          message: 'A line does not match this order.',
        });
      }
      if (item.lineStatus !== OrderLineStatus.Open) {
        throw new ConflictException({
          code: 'LINE_NOT_OPEN',
          message: 'Only open lines can be confirmed or declined.',
        });
      }
      if (line.action === 'decline') {
        await this.prisma.orderItem.update({
          where: { id: item.id },
          data: { lineStatus: OrderLineStatus.Declined },
        });
        declined += 1;
        continue;
      }
      const nextQty = line.quantity ?? item.quantity.toNumber();
      if (nextQty > item.requestedQuantity.toNumber()) {
        throw new BadRequestException({
          code: 'QTY_TOO_HIGH',
          message: 'Confirm quantity cannot exceed the requested quantity.',
        });
      }
      await this.prisma.orderItem.update({
        where: { id: item.id },
        data: {
          quantity: nextQty,
          lineStatus: OrderLineStatus.Confirmed,
        },
      });
      confirmed += 1;
    }

    const refreshed = await this.loadForParty(id, actorCompanyId);
    const stillOpen = refreshed.items.some((item) => item.lineStatus === OrderLineStatus.Open);
    const anyConfirmed = refreshed.items.some(
      (item) => item.lineStatus === OrderLineStatus.Confirmed,
    );
    const allDeclined = refreshed.items.every(
      (item) => item.lineStatus === OrderLineStatus.Declined,
    );

    let nextStatus: string = order.status;
    const firmInquiry = confirmed > 0 ? this.firmInquiryData(order.intent) : {};
    if (allDeclined) {
      nextStatus = OrderStatus.Declined;
      await this.prisma.order.update({
        where: { id },
        data: { status: OrderStatus.Declined, closedAt: new Date(), ...this.withActor(userId) },
      });
    } else if (!stillOpen && anyConfirmed) {
      nextStatus = OrderStatus.Confirmed;
      await this.prisma.order.update({
        where: { id },
        data: {
          status: OrderStatus.Confirmed,
          confirmedAt: new Date(),
          confirmedByCompanyId: actorCompanyId,
          confirmedByUserId: userId,
          ...firmInquiry,
          ...this.withActor(userId),
        },
      });
    } else if (Object.keys(firmInquiry).length > 0) {
      await this.prisma.order.update({
        where: { id },
        data: { ...firmInquiry, ...this.withActor(userId) },
      });
    }

    const orderLabel = shortOrderLabel(id);
    const actorLabel = order.seller.name;
    const notice = dto.note ?? linesDecidedNotice(actorLabel, confirmed, declined);
    const activeCount = refreshed.items.filter(
      (item) => item.lineStatus !== OrderLineStatus.Declined,
    ).length;
    await this.postOrderCard(
      order.buyerCompanyId,
      order.sellerCompanyId,
      actorCompanyId,
      notice,
      id,
      {
        status: nextStatus,
        itemCount: activeCount,
        confirmedCount: confirmed,
        declinedCount: declined,
        kind: 'order_lines',
        event: OrderChatEvent.LinesDecided,
        orderLabel,
        actorLabel,
        actorRole: 'seller',
      },
    );

    if (nextStatus !== order.status) {
      if (nextStatus === OrderStatus.Confirmed) {
        await this.trail.append({
          orderId: id,
          type: OrderTrailType.Confirmed,
          actorCompanyId,
          actorUserId: userId,
          detail: linesDecidedNotice(actorLabel, confirmed, declined),
          note: dto.note?.trim() || null,
          ...(await this.trailVoiceFields(actorCompanyId, dto)),
        });
      } else if (nextStatus === OrderStatus.Declined) {
        await this.trail.append({
          orderId: id,
          type: OrderTrailType.Declined,
          actorCompanyId,
          actorUserId: userId,
          note: dto.note?.trim() || null,
          ...(await this.trailVoiceFields(actorCompanyId, dto)),
        });
      }
      await this.passMillLinesToParent(id, actorCompanyId, userId);
      return this.emitAndGet(actorCompanyId, id, nextStatus);
    }
    if (dto.note?.trim() || dto.noteVoiceMediaId) {
      await this.trail.append({
        orderId: id,
        type: OrderTrailType.Updated,
        actorCompanyId,
        actorUserId: userId,
        detail: linesDecidedNotice(actorLabel, confirmed, declined),
        note: dto.note?.trim() || null,
        ...(await this.trailVoiceFields(actorCompanyId, dto)),
      });
    }
    await this.prisma.order.update({
      where: { id },
      data: this.withActor(userId),
    });
    await this.passMillLinesToParent(id, actorCompanyId, userId);
    return this.get(actorCompanyId, id);
  }

  async decline(
    actorCompanyId: string,
    userId: string,
    id: string,
    dto: DeclineOrderDto = {},
  ): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    await this.transition(actorCompanyId, userId, id, {
      actor: 'seller',
      from: [OrderStatus.Requested],
      next: OrderStatus.Declined,
      data: { closedAt: new Date() },
    });
    await this.prisma.orderItem.updateMany({
      where: { orderId: id, lineStatus: OrderLineStatus.Open },
      data: { lineStatus: OrderLineStatus.Declined },
    });
    const orderLabel = shortOrderLabel(id);
    const actorLabel = order.seller.name;
    const note = dto.note?.trim() || null;
    await this.postOrderCard(
      order.buyerCompanyId,
      order.sellerCompanyId,
      actorCompanyId,
      note || `${actorLabel} declined`,
      id,
      {
        status: OrderStatus.Declined,
        itemCount: order.items.length,
        event: OrderChatEvent.OrderDeclined,
        orderLabel,
        actorLabel,
        actorRole: 'seller',
      },
    );
    await this.trail.append({
      orderId: id,
      type: OrderTrailType.Declined,
      actorCompanyId,
      actorUserId: userId,
      note,
      ...(await this.trailVoiceFields(actorCompanyId, dto)),
    });
    return this.get(actorCompanyId, id);
  }

  async dispatch(actorCompanyId: string, userId: string, id: string, dto: DispatchDto): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    if (order.sellerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only the seller can do this.',
      });
    }
    if (
      order.status !== OrderStatus.Confirmed &&
      order.status !== OrderStatus.PartShipped
    ) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: 'Only a confirmed or part-shipped order can be dispatched.',
      });
    }

    const shippedByItem = this.shippedTotals(order);
    const candidates =
      dto.items ??
      order.items
        .filter((item) => item.lineStatus === OrderLineStatus.Confirmed)
        .map((item) => {
          const shipped = shippedByItem.get(item.id) ?? 0;
          const remaining = item.quantity.toNumber() - shipped;
          return { orderItemId: item.id, quantity: remaining };
        })
        .filter((line) => line.quantity > 0);

    if (candidates.length < 1) {
      throw new BadRequestException({
        code: 'NOTHING_TO_SHIP',
        message: 'There is nothing left to dispatch.',
      });
    }

    const byId = new Map(order.items.map((item) => [item.id, item]));
    for (const line of candidates) {
      const item = byId.get(line.orderItemId);
      if (!item || item.lineStatus === OrderLineStatus.Declined) {
        throw new NotFoundException({
          code: 'INVALID_ITEM',
          message: 'A dispatch line does not match this order.',
        });
      }
      if (
        item.lineStatus !== OrderLineStatus.Confirmed &&
        item.lineStatus !== OrderLineStatus.Dispatched
      ) {
        throw new ConflictException({
          code: 'LINE_NOT_SHIPPABLE',
          message: 'Only confirmed lines can be dispatched.',
        });
      }
      const shipped = shippedByItem.get(item.id) ?? 0;
      const remaining = item.quantity.toNumber() - shipped;
      if (line.quantity > remaining + 1e-9) {
        throw new BadRequestException({
          code: 'QTY_TOO_HIGH',
          message: 'Dispatch quantity exceeds what is left to ship.',
        });
      }
    }

    const now = new Date();
    await this.prisma.orderShipment.create({
      data: {
        orderId: id,
        transporter: dto.transporter ?? null,
        lrNumber: dto.lrNumber ?? null,
        parcelCount: dto.parcelCount ?? null,
        dispatchedAt: now,
        dispatchedByUserId: userId,
        items: {
          create: candidates.map((line) => ({
            orderItemId: line.orderItemId,
            quantity: line.quantity,
          })),
        },
      },
    });

    // Refresh shipped totals and flip line/order status when fully out.
    const after = await this.loadForParty(id, actorCompanyId);
    const shippedAfter = this.shippedTotals(after);
    for (const item of after.items) {
      if (item.lineStatus === OrderLineStatus.Declined) continue;
      if (item.lineStatus !== OrderLineStatus.Confirmed && item.lineStatus !== OrderLineStatus.Dispatched) {
        continue;
      }
      const shipped = shippedAfter.get(item.id) ?? 0;
      if (shipped + 1e-9 >= item.quantity.toNumber()) {
        await this.prisma.orderItem.update({
          where: { id: item.id },
          data: { lineStatus: OrderLineStatus.Dispatched },
        });
      }
    }

    const final = await this.loadForParty(id, actorCompanyId);
    const shippable = final.items.filter((item) => item.lineStatus !== OrderLineStatus.Declined);
    const allOut = shippable.every((item) => {
      if (item.lineStatus === OrderLineStatus.Open) return false;
      const shipped = this.shippedTotals(final).get(item.id) ?? 0;
      return (
        item.lineStatus === OrderLineStatus.Dispatched ||
        item.lineStatus === OrderLineStatus.Delivered ||
        shipped + 1e-9 >= item.quantity.toNumber()
      );
    });
    const hasConfirmed = shippable.some((item) => item.lineStatus === OrderLineStatus.Confirmed);

    const orderLabel = shortOrderLabel(id);
    const actorLabel = order.seller.name;
    const lrNote = dto.lrNumber ? ` · LR ${dto.lrNumber}` : '';
    const dispatchNote = dto.note?.trim() || null;
    const dispatchVoice = await this.trailVoiceFields(actorCompanyId, dto);

    if (allOut && !hasConfirmed) {
      const days = this.config.get('RETURN_WINDOW_DAYS', { infer: true });
      const closesAt = days > 0 ? new Date(Date.now() + days * DAY_MS) : null;
      await this.prisma.order.update({
        where: { id },
        data: {
          status: OrderStatus.Dispatched,
          dispatchedAt: now,
          returnWindowClosesAt: closesAt,
          closedAt: now,
          transporter: dto.transporter ?? order.transporter,
          lrNumber: dto.lrNumber ?? order.lrNumber,
          parcelCount: dto.parcelCount ?? order.parcelCount,
          ...this.withActor(userId),
        },
      });
      await this.trail.append({
        orderId: id,
        type: OrderTrailType.Dispatched,
        at: now,
        actorCompanyId,
        actorUserId: userId,
        detail: dto.lrNumber ? `LR ${dto.lrNumber}` : 'Dispatched · complete',
        note: dispatchNote,
        ...dispatchVoice,
      });
      await this.postOrderCard(
        order.buyerCompanyId,
        order.sellerCompanyId,
        actorCompanyId,
        `${actorLabel} dispatched · complete${lrNote}`,
        id,
        {
          status: OrderStatus.Dispatched,
          itemCount: candidates.length,
          event: OrderChatEvent.OrderDispatched,
          orderLabel,
          actorLabel,
          actorRole: 'seller',
          partial: false,
          lrNumber: dto.lrNumber ?? null,
        },
      );
      if (closesAt) {
        await this.jobs.enqueue(JobType.ReturnWindowExpire, { orderId: id }, closesAt);
      }
      await this.passMillDispatchToParent(id, actorCompanyId, userId, candidates);
      return this.emitAndGet(actorCompanyId, id, OrderStatus.Dispatched);
    }

    // Partial ship — main status Part shipped; keep latest LR on order for list UIs.
    await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.PartShipped,
        transporter: dto.transporter ?? order.transporter,
        lrNumber: dto.lrNumber ?? order.lrNumber,
        parcelCount: dto.parcelCount ?? order.parcelCount,
        ...this.withActor(userId),
      },
    });
    await this.trail.append({
      orderId: id,
      type: OrderTrailType.PartShipped,
      at: now,
      actorCompanyId,
      actorUserId: userId,
      detail: dto.lrNumber ? `LR ${dto.lrNumber}` : null,
      note: dispatchNote,
      ...dispatchVoice,
    });
    await this.postOrderCard(
      order.buyerCompanyId,
      order.sellerCompanyId,
      actorCompanyId,
      `${actorLabel} dispatched part${lrNote}`,
      id,
      {
        status: OrderStatus.PartShipped,
        itemCount: candidates.length,
        event: OrderChatEvent.OrderDispatched,
        orderLabel,
        actorLabel,
        actorRole: 'seller',
        partial: true,
        lrNumber: dto.lrNumber ?? null,
      },
    );
    await this.passMillDispatchToParent(id, actorCompanyId, userId, candidates);
    return this.emitAndGet(actorCompanyId, id, OrderStatus.PartShipped);
  }

  /** Seller closes a part-shipped order: qty := shipped, status → settled. */
  async settle(
    actorCompanyId: string,
    userId: string,
    id: string,
    dto: SettleOrderDto = {},
  ): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    if (order.sellerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only the seller can settle.',
      });
    }
    if (
      order.status !== OrderStatus.Confirmed &&
      order.status !== OrderStatus.PartShipped
    ) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: 'Only a part-shipped order can be settled.',
      });
    }
    const shippedByItem = this.shippedTotals(order);
    const shippable = order.items.filter((item) => item.lineStatus !== OrderLineStatus.Declined);
    const shippedTotal = shippable.reduce(
      (sum, item) => sum + (shippedByItem.get(item.id) ?? 0),
      0,
    );
    const remaining = shippable.reduce((sum, item) => {
      const shipped = shippedByItem.get(item.id) ?? 0;
      return sum + Math.max(0, item.quantity.toNumber() - shipped);
    }, 0);
    if (shippedTotal <= 0 || remaining <= 0) {
      throw new BadRequestException({
        code: 'NOT_PART_SHIPPED',
        message: 'Settle when some quantity has shipped and some remains.',
      });
    }

    const voice = await this.noteVoiceMetadata(actorCompanyId, dto);
    let asked = 0;
    let shippedSum = 0;
    for (const item of shippable) {
      const shipped = shippedByItem.get(item.id) ?? 0;
      asked += item.requestedQuantity.toNumber();
      shippedSum += shipped;
      if (shipped <= 0) {
        await this.prisma.orderItem.update({
          where: { id: item.id },
          data: { quantity: 0, lineStatus: OrderLineStatus.Declined },
        });
      } else {
        await this.prisma.orderItem.update({
          where: { id: item.id },
          data: { quantity: shipped, lineStatus: OrderLineStatus.Dispatched },
        });
      }
    }

    const now = new Date();
    const days = this.config.get('RETURN_WINDOW_DAYS', { infer: true });
    const closesAt = days > 0 ? new Date(Date.now() + days * DAY_MS) : null;
    await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.Settled,
        settledAt: now,
        settledByUserId: userId,
        returnWindowClosesAt: closesAt,
        closedAt: now,
        ...this.withActor(userId),
      },
    });

    const detail = `Closed on ${shippedSum} of ${asked}`;
    const orderLabel = shortOrderLabel(id);
    const actorLabel = order.seller.name;
    await this.trail.append({
      orderId: id,
      type: OrderTrailType.Settled,
      at: now,
      actorCompanyId,
      actorUserId: userId,
      summary: `${actorLabel} settled`,
      detail,
      note: dto.note?.trim() || null,
      noteVoiceMediaId: typeof voice.noteVoiceMediaId === 'string' ? voice.noteVoiceMediaId : null,
      noteVoiceUrl: typeof voice.noteVoiceUrl === 'string' ? voice.noteVoiceUrl : null,
      noteVoiceDurationMs:
        typeof voice.noteVoiceDurationMs === 'number' ? voice.noteVoiceDurationMs : null,
    });

    await this.postOrderCard(
      order.buyerCompanyId,
      order.sellerCompanyId,
      actorCompanyId,
      dto.note?.trim() || `${actorLabel} settled · ${detail}`,
      id,
      {
        status: OrderStatus.Settled,
        event: OrderChatEvent.OrderSettled,
        orderLabel,
        actorLabel,
        actorRole: 'seller',
        partial: false,
        ...voice,
      },
    );
    if (closesAt) {
      await this.jobs.enqueue(JobType.ReturnWindowExpire, { orderId: id }, closesAt);
    }
    await this.passMillSettleToParent(id, actorCompanyId, userId);
    return this.emitAndGet(actorCompanyId, id, OrderStatus.Settled);
  }
  async deliver(actorCompanyId: string, userId: string, id: string): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    if (order.buyerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only the buyer can do this.',
      });
    }
    if (order.status !== OrderStatus.Dispatched) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: 'Mark the order fully dispatched before delivering.',
      });
    }

    const days = this.config.get('RETURN_WINDOW_DAYS', { infer: true });
    const closesAt = days > 0 ? new Date(Date.now() + days * DAY_MS) : null;
    await this.prisma.orderItem.updateMany({
      where: {
        orderId: id,
        lineStatus: { in: [OrderLineStatus.Dispatched, OrderLineStatus.Confirmed] },
      },
      data: { lineStatus: OrderLineStatus.Delivered },
    });
    const view = await this.transition(actorCompanyId, userId, id, {
      actor: 'buyer',
      from: [OrderStatus.Dispatched],
      next: OrderStatus.Delivered,
      data: {
        deliveredAt: new Date(),
        returnWindowClosesAt: closesAt,
        deliveredByUserId: userId,
      },
    });
    const orderLabel = shortOrderLabel(id);
    const actorLabel = order.buyer.name;
    await this.postOrderCard(
      order.buyerCompanyId,
      order.sellerCompanyId,
      actorCompanyId,
      `${actorLabel} marked delivered`,
      id,
      {
        status: OrderStatus.Delivered,
        itemCount: order.items.length,
        event: OrderChatEvent.OrderDelivered,
        orderLabel,
        actorLabel,
        actorRole: 'buyer',
      },
    );
    await this.trail.append({
      orderId: id,
      type: OrderTrailType.Delivered,
      actorCompanyId,
      actorUserId: userId,
    });
    if (closesAt) {
      await this.jobs.enqueue(JobType.ReturnWindowExpire, { orderId: id }, closesAt);
    }
    return view;
  }

  /**
   * I handle desk: patch held mill hops (optional) then release to suppliers.
   */
  async sendUp(
    actorCompanyId: string,
    userId: string,
    id: string,
    dto: SendUpOrderDto = {},
  ): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    if (order.sellerCompanyId !== actorCompanyId || order.tradeMode !== OrderTradeMode.Manage) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only you can send this on.',
      });
    }
    const settings = await this.prisma.companySettings.findUnique({
      where: { companyId: actorCompanyId },
      select: { tradeDefaults: true },
    });
    if (!resolveTradePresence(settings?.tradeDefaults).trading) {
      throw new BadRequestException({
        code: 'TRADING_REQUIRED',
        message: 'Turn on Trading in Profile to send this on.',
      });
    }

    const upstreams = await this.prisma.order.findMany({
      where: {
        downstreamOrderId: id,
        upstreamReleasedAt: null,
        ...(dto.upstreamOrderId ? { id: dto.upstreamOrderId } : {}),
      },
      include: { items: true },
    });
    if (upstreams.length === 0) {
      throw new BadRequestException({
        code: 'NOTHING_TO_SEND',
        message: 'Nothing waiting to send.',
      });
    }

    const patches = dto.items ?? [];
    const now = new Date();
    for (const up of upstreams) {
      for (const item of up.items) {
        const patch = patches.find(
          (row) =>
            (row.orderItemId && row.orderItemId === item.id) ||
            (row.productId && row.productId === item.productId),
        );
        if (!patch) continue;
        await this.prisma.orderItem.update({
          where: { id: item.id },
          data: {
            ...(patch.quantity != null
              ? { quantity: patch.quantity, requestedQuantity: patch.quantity }
              : {}),
            ...(patch.rate != null ? { rate: patch.rate } : {}),
          },
        });
      }
      await this.prisma.order.update({
        where: { id: up.id },
        data: { upstreamReleasedAt: now, updatedByUserId: userId },
      });
      const lane = await this.upsertTradeLane(
        actorCompanyId,
        up.sellerCompanyId,
        order.buyerCompanyId,
      );
      if (lane.reveal) {
        const groupThreadId = await this.threads.ensureTradeLaneGroup(
          lane.traderCompanyId,
          lane.sellerCompanyId,
          lane.buyerCompanyId,
          lane.groupThreadId,
        );
        if (groupThreadId !== lane.groupThreadId) {
          await this.prisma.tradeLane.update({
            where: { id: lane.id },
            data: { groupThreadId },
          });
        }
      }
      await this.announceReleasedUpstream(up.id, actorCompanyId);
    }

    return this.get(actorCompanyId, id);
  }

  async millPassHold(
    actorCompanyId: string,
    userId: string,
    id: string,
    dto: MillPassHoldDto,
  ): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    if (order.sellerCompanyId !== actorCompanyId || order.tradeMode !== OrderTradeMode.Manage) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only you can hold this.',
      });
    }
    const up = await this.prisma.order.findFirst({
      where: { id: dto.upstreamOrderId, downstreamOrderId: id },
      include: { seller: true },
    });
    if (!up || !up.upstreamReleasedAt) {
      throw new BadRequestException({
        code: 'NOT_SENT',
        message: 'Send to this mill first.',
      });
    }
    await this.prisma.order.update({
      where: { id: up.id },
      data: { passHeldAt: dto.held ? new Date() : null, updatedByUserId: userId },
    });
    await this.trail.append({
      orderId: id,
      type: OrderTrailType.Updated,
      actorCompanyId,
      actorUserId: userId,
      summary: dto.held ? `You held ${up.seller.name}` : `You resumed ${up.seller.name}`,
    });
    return this.get(actorCompanyId, id);
  }

  /** TradeLane: mill and end buyer can see each other (trio group). */
  async millReveal(
    actorCompanyId: string,
    _userId: string,
    id: string,
    dto: MillRevealDto,
  ): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    if (order.sellerCompanyId !== actorCompanyId || order.tradeMode !== OrderTradeMode.Manage) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only you can change this.',
      });
    }
    const up = await this.prisma.order.findFirst({
      where: { id: dto.upstreamOrderId, downstreamOrderId: id },
      select: {
        id: true,
        sellerCompanyId: true,
        upstreamReleasedAt: true,
        seller: { select: { name: true } },
      },
    });
    if (!up) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Mill lot not found.' });
    }
    const lane = await this.upsertTradeLane(
      actorCompanyId,
      up.sellerCompanyId,
      order.buyerCompanyId,
      { reveal: dto.reveal },
    );
    if (dto.reveal && up.upstreamReleasedAt) {
      const groupThreadId = await this.threads.ensureTradeLaneGroup(
        lane.traderCompanyId,
        lane.sellerCompanyId,
        lane.buyerCompanyId,
        lane.groupThreadId,
      );
      if (groupThreadId !== lane.groupThreadId) {
        await this.prisma.tradeLane.update({
          where: { id: lane.id },
          data: { groupThreadId },
        });
      }
    }
    return this.get(actorCompanyId, id);
  }

  /**
   * Live flip This order is with (Requested + no seller quote).
   * Your paths does not call this — future-only there.
   */
  async flipTicket(
    actorCompanyId: string,
    userId: string,
    id: string,
    dto: OrderTicketDto,
  ): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId, true);
    const sellerQuoted = await this.hasSellerQuote(order.id, order.sellerCompanyId);
    if (
      order.status !== OrderStatus.Requested ||
      sellerQuoted ||
      order.items.some((item) => item.lineStatus !== OrderLineStatus.Open)
    ) {
      throw new ConflictException({
        code: 'SELLER_PROGRESS',
        message: 'Change who the order is with only before the supplier responds.',
      });
    }

    if (order.tradeMode === OrderTradeMode.Direct) {
      if (order.facilitatorCompanyId !== actorCompanyId) {
        throw new ForbiddenException({
          code: 'NOT_ALLOWED',
          message: 'Only you can change this.',
        });
      }
      if (dto.ticket !== TradeLaneTicket.Me) {
        return this.get(actorCompanyId, id);
      }
      const result = await this.takeControl(actorCompanyId, userId, id);
      await this.upsertTradeLane(
        actorCompanyId,
        order.sellerCompanyId,
        order.buyerCompanyId,
        { ticket: TradeLaneTicket.Me },
      );
      return result.downstream;
    }

    if (order.tradeMode !== OrderTradeMode.Manage || order.sellerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only you can change this.',
      });
    }

    const ups = await this.prisma.order.findMany({
      where: { downstreamOrderId: id, status: { not: OrderStatus.Cancelled } },
      include: { items: true, seller: true },
    });
    if (ups.length === 0) {
      throw new BadRequestException({
        code: 'NO_MILL',
        message: 'Send is not set up for a mill yet.',
      });
    }

    if (dto.ticket === TradeLaneTicket.Me) {
      for (const hop of ups) {
        await this.upsertTradeLane(actorCompanyId, hop.sellerCompanyId, order.buyerCompanyId, {
          ticket: TradeLaneTicket.Me,
        });
      }
      return this.get(actorCompanyId, id);
    }

    if (dto.ticket !== TradeLaneTicket.Mill) {
      return this.get(actorCompanyId, id);
    }

    // Mills = observe on the same main + linked lots (uniform; scales to many mills).
    // Do not cancel / spawn N Directs — trader watches this card; Find sub → main.
    for (const hop of ups) {
      await this.upsertTradeLane(actorCompanyId, hop.sellerCompanyId, order.buyerCompanyId, {
        ticket: TradeLaneTicket.Mill,
      });
    }
    return this.get(actorCompanyId, id);
  }

  private async announceReleasedUpstream(orderId: string, actorCompanyId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_RELATIONS,
    });
    if (!order) return;
    const inquiry = order.intent === OrderIntent.Inquiry;
    await this.threads.ensureTradeThread(order.buyerCompanyId, order.sellerCompanyId);
    const actorLabel = order.buyer.name;
    await this.upsertOrderThreadMessage(
      order.buyerCompanyId,
      order.sellerCompanyId,
      actorCompanyId,
      order.note ?? (inquiry ? `${actorLabel} asked for rates` : `${actorLabel} requested`),
      order.id,
      {
        status: order.status,
        itemCount: order.items.length,
        event: inquiry ? OrderChatEvent.RateRequested : OrderChatEvent.OrderRequested,
        orderLabel: shortOrderLabel(order.id, { inquiry }),
        actorLabel,
        actorRole: 'buyer',
        intent: order.intent,
        parentOrderId: order.downstreamOrderId,
        parentOrderLabel: order.downstreamOrderId
          ? shortOrderLabel(order.downstreamOrderId, { inquiry })
          : undefined,
      },
      MessageType.OrderCard,
    );
    this.events.orderCreated({
      orderId: order.id,
      buyerCompanyId: order.buyerCompanyId,
      sellerCompanyId: order.sellerCompanyId,
      facilitatorCompanyId: order.facilitatorCompanyId,
    });
  }

  /**
   * Facilitator Take control: cancel Direct order, create Manage pair (requested only).
   */
  async takeControl(
    actorCompanyId: string,
    userId: string,
    id: string,
  ): Promise<{ downstream: OrderView; upstream: OrderView; cancelledOrderId: string }> {
    const order = await this.loadForParty(id, actorCompanyId, true);
    if (order.facilitatorCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only the company in the loop can take control.',
      });
    }
    if (order.tradeMode !== OrderTradeMode.Direct) {
      throw new BadRequestException({
        code: 'NOT_DIRECT',
        message: 'Only direct orders can be taken over.',
      });
    }
    const settings = await this.prisma.companySettings.findUnique({
      where: { companyId: actorCompanyId },
      select: { tradeDefaults: true },
    });
    if (!resolveTradePresence(settings?.tradeDefaults).trading) {
      throw new BadRequestException({
        code: 'TRADING_REQUIRED',
        message: 'Turn on Trading in Profile to take control.',
      });
    }
    const sellerQuoted = await this.hasSellerQuote(order.id, order.sellerCompanyId);
    if (
      order.status !== OrderStatus.Requested ||
      sellerQuoted ||
      order.items.some((item) => item.lineStatus !== OrderLineStatus.Open)
    ) {
      throw new ConflictException({
        code: 'SELLER_PROGRESS',
        message: 'Take control only before the supplier responds.',
      });
    }

    const lineItems = order.items.map((item) => ({
      productId: item.productId ?? undefined,
      quantity: item.quantity.toNumber(),
      images: item.images ?? [],
      note: item.note ?? undefined,
      unit: (item.unit as CreateOrderDto['items'][number]['unit']) ?? undefined,
      name: item.name,
    }));

    const downstream = await this.create(
      order.buyerCompanyId,
      userId,
      {
        sellerCompanyId: actorCompanyId,
        kind: order.kind as CreateOrderDto['kind'],
        intent: (order.intent as CreateOrderDto['intent']) ?? OrderIntent.Order,
        note: order.note ?? undefined,
        items: lineItems,
      },
      { tradeMode: OrderTradeMode.Manage, allowForeignProducts: true },
    );

    const upstream = await this.create(
      actorCompanyId,
      userId,
      {
        sellerCompanyId: order.sellerCompanyId,
        kind: order.kind as CreateOrderDto['kind'],
        intent: (order.intent as CreateOrderDto['intent']) ?? OrderIntent.Order,
        note: `Taken over · for #${downstream.id.slice(-6).toUpperCase()}`,
        items: lineItems.filter((item) => item.productId),
      },
      { downstreamOrderId: downstream.id, holdUntilSend: true },
    );

    await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.Cancelled, closedAt: new Date(), ...this.withActor(userId) },
    });
    const orderLabel = shortOrderLabel(id);
    await this.postOrderCard(
      order.buyerCompanyId,
      order.sellerCompanyId,
      actorCompanyId,
      `${order.buyer.name} order taken over`,
      id,
      {
        status: OrderStatus.Cancelled,
        itemCount: order.items.length,
        event: OrderChatEvent.OrderCancelled,
        orderLabel,
        actorLabel: order.buyer.name,
        actorRole: 'buyer',
      },
    );

    return { downstream, upstream, cancelledOrderId: id };
  }

  async cancel(
    actorCompanyId: string,
    userId: string,
    id: string,
    dto: CancelOrderDto = {},
  ): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    const view = await this.transition(actorCompanyId, userId, id, {
      actor: 'buyer',
      from: [OrderStatus.Requested, OrderStatus.Confirmed],
      next: OrderStatus.Cancelled,
      data: { closedAt: new Date() },
    });
    const orderLabel = shortOrderLabel(id);
    const actorLabel = order.buyer.name;
    const note = dto.note?.trim() || null;
    await this.postOrderCard(
      order.buyerCompanyId,
      order.sellerCompanyId,
      actorCompanyId,
      note || `${actorLabel} cancelled`,
      id,
      {
        status: OrderStatus.Cancelled,
        itemCount: order.items.length,
        event: OrderChatEvent.OrderCancelled,
        orderLabel,
        actorLabel,
        actorRole: 'buyer',
      },
    );
    await this.trail.append({
      orderId: id,
      type: OrderTrailType.Cancelled,
      actorCompanyId,
      actorUserId: userId,
      note,
      ...(await this.trailVoiceFields(actorCompanyId, dto)),
    });
    return view;
  }

  private shippedTotals(order: {
    shipments?: { items: { orderItemId: string; quantity: Prisma.Decimal }[] }[];
  }): Map<string, number> {
    const map = new Map<string, number>();
    for (const shipment of order.shipments ?? []) {
      for (const line of shipment.items) {
        map.set(line.orderItemId, (map.get(line.orderItemId) ?? 0) + line.quantity.toNumber());
      }
    }
    return map;
  }

  /** Clear soft rate-ask intent when seller/buyer commits. */
  private firmInquiryData(intent: string | null | undefined): { intent?: string } {
    return intent === OrderIntent.Inquiry ? { intent: OrderIntent.Order } : {};
  }

  /** Buyer may replace lines until the seller quotes/confirms/declines. */
  private async buyerCanAmend(
    order: {
      id: string;
      kind: string;
      status: string;
      buyerCompanyId: string;
      sellerCompanyId: string;
      items: { lineStatus: string }[];
    },
    actorCompanyId: string,
  ): Promise<boolean> {
    if (order.buyerCompanyId !== actorCompanyId) return false;
    if (order.status !== OrderStatus.Requested) return false;
    if (order.kind === OrderKind.Photo) return false;
    if (!order.items.every((item) => item.lineStatus === OrderLineStatus.Open)) return false;
    const sellerMoved = await this.prisma.message.findFirst({
      where: {
        referenceId: order.id,
        senderCompanyId: order.sellerCompanyId,
        type: { in: [MessageType.Rate, MessageType.OrderCard, MessageType.System] },
      },
      select: { id: true },
    });
    return !sellerMoved;
  }

  /**
   * True when the seller has quoted this order. After upsert, the living message
   * may become order_card again — `metadata.quoted` is preserved across updates.
   */
  private async hasSellerQuote(orderId: string, sellerCompanyId: string): Promise<boolean> {
    const quote = await this.prisma.message.findFirst({
      where: {
        referenceId: orderId,
        OR: [
          { type: MessageType.Rate, senderCompanyId: sellerCompanyId },
          {
            type: { in: [MessageType.Rate, MessageType.OrderCard] },
            metadata: { path: ['quoted'], equals: true },
          },
        ],
      },
      select: { id: true },
    });
    return Boolean(quote);
  }

  private async orderIdsWithSellerQuote(
    orders: { id: string; sellerCompanyId: string }[],
  ): Promise<Set<string>> {
    if (orders.length === 0) return new Set();
    const rows = await this.prisma.message.findMany({
      where: {
        referenceId: { in: orders.map((order) => order.id) },
        type: { in: [MessageType.Rate, MessageType.OrderCard] },
        OR: [
          {
            type: MessageType.Rate,
            senderCompanyId: { in: [...new Set(orders.map((order) => order.sellerCompanyId))] },
          },
          { metadata: { path: ['quoted'], equals: true } },
        ],
      },
      select: { referenceId: true, senderCompanyId: true, type: true, metadata: true },
    });
    const byId = new Map(orders.map((order) => [order.id, order.sellerCompanyId]));
    const quoted = new Set<string>();
    for (const row of rows) {
      if (!row.referenceId) continue;
      const meta =
        row.metadata && typeof row.metadata === 'object'
          ? (row.metadata as Record<string, unknown>)
          : null;
      if (meta?.quoted === true) {
        quoted.add(row.referenceId);
        continue;
      }
      if (row.type === MessageType.Rate && byId.get(row.referenceId) === row.senderCompanyId) {
        quoted.add(row.referenceId);
      }
    }
    return quoted;
  }

  private buyerCanAcceptQuoteSync(
    order: {
      status: string;
      buyerCompanyId: string;
      items: { lineStatus: string; rate?: unknown }[];
    },
    actorCompanyId: string,
    sellerQuoted: boolean,
  ): boolean {
    if (order.buyerCompanyId !== actorCompanyId) return false;
    if (order.status !== OrderStatus.Requested) return false;
    if (!sellerQuoted) return false;
    return order.items.some(
      (item) => item.lineStatus === OrderLineStatus.Open && item.rate != null,
    );
  }

  /**
   * One living order/rate message per order in the trade thread.
   * Later lifecycle events update that row instead of appending cards.
   */
  private async postOrderCard(
    buyerCompanyId: string,
    sellerCompanyId: string,
    senderCompanyId: string,
    body: string,
    orderId: string,
    metadata: Record<string, unknown>,
  ): Promise<string> {
    return this.upsertOrderThreadMessage(
      buyerCompanyId,
      sellerCompanyId,
      senderCompanyId,
      body,
      orderId,
      metadata,
      MessageType.OrderCard,
    );
  }

  /** Public entry for other order-domain services (returns, etc.). */
  async postLifecycleCard(
    buyerCompanyId: string,
    sellerCompanyId: string,
    senderCompanyId: string,
    body: string,
    orderId: string,
    metadata: Record<string, unknown>,
  ): Promise<string> {
    return this.postOrderCard(
      buyerCompanyId,
      sellerCompanyId,
      senderCompanyId,
      body,
      orderId,
      metadata,
    );
  }

  private async trailVoiceFields(
    companyId: string,
    dto: { noteVoiceMediaId?: string; noteVoiceDurationMs?: number },
  ): Promise<{
    noteVoiceMediaId: string | null;
    noteVoiceUrl: string | null;
    noteVoiceDurationMs: number | null;
  }> {
    const resolved = await resolveNoteVoiceFields(this.prisma, companyId, dto);
    return {
      noteVoiceMediaId: resolved.noteVoiceMediaId,
      noteVoiceUrl: resolved.noteVoiceUrl,
      noteVoiceDurationMs: resolved.noteVoiceDurationMs,
    };
  }

  private async noteVoiceCreateFields(
    companyId: string,
    dto: { noteVoiceMediaId?: string; noteVoiceDurationMs?: number },
  ): Promise<{
    noteVoiceMediaId: string | null;
    noteVoiceUrl: string | null;
    noteVoiceDurationMs: number | null;
  }> {
    const voice = await this.resolveOwnedNoteVoice(companyId, dto);
    if (!voice) {
      return {
        noteVoiceMediaId: null,
        noteVoiceUrl: null,
        noteVoiceDurationMs: null,
      };
    }
    return {
      noteVoiceMediaId: voice.mediaId,
      noteVoiceUrl: voice.url,
      noteVoiceDurationMs: voice.durationMs,
    };
  }

  private async noteVoiceMetadata(
    companyId: string,
    dto: { noteVoiceMediaId?: string; noteVoiceDurationMs?: number },
  ): Promise<Record<string, unknown>> {
    const voice = await this.resolveOwnedNoteVoice(companyId, dto);
    if (!voice) return {};
    return {
      noteVoiceMediaId: voice.mediaId,
      noteVoiceUrl: voice.url,
      noteVoiceDurationMs: voice.durationMs,
    };
  }

  private async resolveOwnedNoteVoice(
    companyId: string,
    dto: { noteVoiceMediaId?: string; noteVoiceDurationMs?: number },
  ): Promise<{ mediaId: string; url: string; durationMs: number } | null> {
    if (!dto.noteVoiceMediaId) return null;
    if (!dto.noteVoiceDurationMs) {
      throw new BadRequestException({
        code: 'VOICE_DURATION_REQUIRED',
        message: 'Voice note needs a duration.',
      });
    }
    const media = await this.prisma.media.findFirst({
      where: {
        id: dto.noteVoiceMediaId,
        companyId,
        kind: MediaKind.Audio,
      },
    });
    if (!media) {
      throw new BadRequestException({
        code: 'VOICE_NOT_FOUND',
        message: 'Voice note not found. Record again.',
      });
    }
    return {
      mediaId: media.id,
      url: media.url,
      durationMs: dto.noteVoiceDurationMs,
    };
  }

  private async upsertOrderThreadMessage(
    buyerCompanyId: string,
    sellerCompanyId: string,
    senderCompanyId: string,
    body: string,
    orderId: string,
    metadata: Record<string, unknown>,
    type: typeof MessageType.OrderCard | typeof MessageType.Rate,
  ): Promise<string> {
    const threadId = await this.resolveOrderCardThread(buyerCompanyId, sellerCompanyId, orderId);
    const existing = await this.prisma.message.findFirst({
      where: {
        threadId,
        referenceId: orderId,
        type: { in: [MessageType.OrderCard, MessageType.Rate] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, metadata: true },
    });

    const prevMeta =
      existing?.metadata && typeof existing.metadata === 'object'
        ? (existing.metadata as Record<string, unknown>)
        : null;
    const nextMeta: Record<string, unknown> = { ...metadata };
    if (type === MessageType.Rate || metadata.quoted === true || prevMeta?.quoted === true) {
      nextMeta.quoted = true;
    }
    // Keep quote voice on the living card when later lifecycle pulses omit it.
    for (const key of ['noteVoiceUrl', 'noteVoiceMediaId', 'noteVoiceDurationMs'] as const) {
      if (nextMeta[key] === undefined && prevMeta?.[key] != null) {
        nextMeta[key] = prevMeta[key];
      }
    }

    let messageId: string;
    if (existing) {
      // Bump createdAt so unread (createdAt > lastReadAt) and inbox sort see the update.
      await this.prisma.message.update({
        where: { id: existing.id },
        data: {
          senderCompanyId,
          type,
          body,
          metadata: nextMeta as Prisma.InputJsonValue,
          createdAt: new Date(),
        },
      });
      messageId = existing.id;
    } else {
      const created = await this.prisma.message.create({
        data: {
          threadId,
          senderCompanyId,
          type,
          body,
          referenceId: orderId,
          metadata: nextMeta as Prisma.InputJsonValue,
        },
        select: { id: true },
      });
      messageId = created.id;
    }

    await this.prisma.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });
    await this.announceLivingOrderMessage(
      threadId,
      messageId,
      senderCompanyId,
      body,
      type,
      nextMeta,
    );
    return messageId;
  }

  /** Living card upserts skip MessageService.send — still notify the other party. */
  private async announceLivingOrderMessage(
    threadId: string,
    messageId: string,
    senderCompanyId: string,
    body: string,
    type: typeof MessageType.OrderCard | typeof MessageType.Rate,
    meta: Record<string, unknown>,
  ): Promise<void> {
    const { companyIds, userIds } = await this.threads.notifyUserIdsForMessage(
      threadId,
      senderCompanyId,
    );
    if (companyIds.length === 0 && userIds.length === 0) {
      return;
    }
    const trimmed = body.trim();
    const customNote = trimmed && !/^Quote\b/i.test(trimmed) ? trimmed : null;
    const total =
      typeof meta.totalLabel === 'string' && meta.totalLabel.trim()
        ? meta.totalLabel.trim()
        : null;
    const event = typeof meta.event === 'string' ? meta.event : null;
    const actor =
      typeof meta.actorLabel === 'string' && meta.actorLabel.trim()
        ? meta.actorLabel.trim()
        : null;
    const eventPreview =
      event === OrderChatEvent.OrderSettled
        ? actor
          ? `${actor} settled`
          : 'Settled'
        : event === OrderChatEvent.OrderDispatched
          ? meta.partial === true
            ? actor
              ? `${actor} dispatched part`
              : 'Part dispatched'
            : actor
              ? `${actor} dispatched`
              : 'Dispatched'
          : null;
    const preview =
      eventPreview ||
      customNote ||
      (type === MessageType.Rate && total
        ? `Quote · ${total}`
        : null) ||
      (type === MessageType.Rate ? 'Quote' : 'Order update');
    this.events.messageSent({
      threadId,
      messageId,
      senderCompanyId,
      recipientCompanyIds: companyIds,
      recipientUserIds: userIds,
      preview: preview.slice(0, 140),
    });
  }

  private async emitAndGet(
    actorCompanyId: string,
    id: string,
    status: string,
  ): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    this.events.orderStatusChanged({
      orderId: order.id,
      buyerCompanyId: order.buyerCompanyId,
      sellerCompanyId: order.sellerCompanyId,
      actorCompanyId,
      status,
      facilitatorCompanyId: order.facilitatorCompanyId,
    });
    // Same live flags as get() so mutation responses stay honest for CTAs.
    return this.get(actorCompanyId, id);
  }

  private withActor(userId: string | null): Pick<Prisma.OrderUncheckedUpdateInput, 'updatedByUserId'> {
    return userId ? { updatedByUserId: userId } : {};
  }

  private async transition(
    actorCompanyId: string,
    userId: string | null,
    id: string,
    options: TransitionOptions,
  ): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    const isBuyer = order.buyerCompanyId === actorCompanyId;

    if ((options.actor === 'buyer' && !isBuyer) || (options.actor === 'seller' && isBuyer)) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message:
          options.actor === 'seller'
            ? 'Only the seller can do this.'
            : 'Only the buyer can do this.',
      });
    }
    if (!options.from.includes(order.status)) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: `An order that is ${order.status} cannot move to ${options.next}.`,
      });
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: options.next, ...options.data, ...this.withActor(userId) },
      include: ORDER_RELATIONS,
    });
    this.events.orderStatusChanged({
      orderId: updated.id,
      buyerCompanyId: updated.buyerCompanyId,
      sellerCompanyId: updated.sellerCompanyId,
      actorCompanyId,
      status: options.next,
      facilitatorCompanyId: updated.facilitatorCompanyId,
    });
    const threadId = await this.threads.findDirectThreadId(
      updated.buyerCompanyId,
      updated.sellerCompanyId,
    );
    return this.serializer.toOrderView(updated, actorCompanyId, threadId);
  }

  private async resolveFacilitatorOptions(
    actorCompanyId: string,
    sellerCompanyId: string,
    facilitatorFromDto: string | undefined,
    options: CreateOrderOptions,
  ): Promise<CreateOrderOptions> {
    const facilitatorCompanyId = options.facilitatorCompanyId ?? facilitatorFromDto;
    if (
      !facilitatorCompanyId ||
      facilitatorCompanyId === actorCompanyId ||
      facilitatorCompanyId === sellerCompanyId
    ) {
      return options;
    }
    const settings = await this.prisma.companySettings.findUnique({
      where: { companyId: facilitatorCompanyId },
      select: { tradeDefaults: true },
    });
    if (!resolveTradePresence(settings?.tradeDefaults).trading) {
      throw new BadRequestException({
        code: 'TRADING_REQUIRED',
        message: 'Turn on Trading in Profile to stay in the loop on orders.',
      });
    }
    return {
      ...options,
      tradeMode: options.tradeMode ?? OrderTradeMode.Direct,
      facilitatorCompanyId,
    };
  }

  private async loadForParty(id: string, actorCompanyId: string, withReturns = false) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: withReturns
        ? {
            ...ORDER_RELATIONS,
            returns: {
              orderBy: { createdAt: 'desc' as const },
              include: { items: true },
            },
          }
        : ORDER_RELATIONS,
    });
    if (
      !order ||
      (order.buyerCompanyId !== actorCompanyId &&
        order.sellerCompanyId !== actorCompanyId &&
        order.facilitatorCompanyId !== actorCompanyId) ||
      isHeldFromSupplier(order, actorCompanyId)
    ) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }
    return order;
  }

  private async linkedMillsByParent(
    rows: Array<{ id: string; sellerCompanyId: string; tradeMode: string }>,
    actorCompanyId: string,
  ): Promise<Map<string, Array<{ name: string; orderId: string | null }>>> {
    const manageIds = rows
      .filter(
        (row) =>
          row.sellerCompanyId === actorCompanyId && row.tradeMode === OrderTradeMode.Manage,
      )
      .map((row) => row.id);
    const byParent = new Map<string, Array<{ name: string; orderId: string | null }>>();
    if (manageIds.length === 0) return byParent;
    const ups = await this.prisma.order.findMany({
      where: { downstreamOrderId: { in: manageIds } },
      include: { seller: true },
    });
    for (const up of ups) {
      if (!up.downstreamOrderId) continue;
      const list = byParent.get(up.downstreamOrderId) ?? [];
      list.push({
        name: up.seller.name,
        orderId: up.upstreamReleasedAt ? up.id : null,
      });
      byParent.set(up.downstreamOrderId, list);
    }
    return byParent;
  }

  private async parentIdsNeedingQuotePass(
    rows: Array<{ id: string; sellerCompanyId: string; tradeMode: string }>,
    actorCompanyId: string,
    parentQuotedIds: Set<string>,
  ): Promise<Set<string>> {
    const manageIds = rows
      .filter(
        (row) =>
          row.sellerCompanyId === actorCompanyId &&
          row.tradeMode === OrderTradeMode.Manage &&
          !parentQuotedIds.has(row.id),
      )
      .map((row) => row.id);
    if (manageIds.length === 0) return new Set();
    const ups = await this.prisma.order.findMany({
      where: {
        downstreamOrderId: { in: manageIds },
        upstreamReleasedAt: { not: null },
      },
      select: { id: true, downstreamOrderId: true, sellerCompanyId: true },
    });
    const millQuoted = await this.orderIdsWithSellerQuote(ups);
    const parents = new Set<string>();
    for (const up of ups) {
      if (millQuoted.has(up.id) && up.downstreamOrderId) parents.add(up.downstreamOrderId);
    }
    return parents;
  }

  private async buildMillDesks(
    order: {
      id: string;
      tradeMode: string;
      sellerCompanyId: string;
      buyerCompanyId: string;
      items: Array<{ id: string; productId: string | null }>;
    },
    actorCompanyId: string,
  ): Promise<OrderMillDeskView[]> {
    if (order.tradeMode !== OrderTradeMode.Manage) {
      return [];
    }
    const isTrader = order.sellerCompanyId === actorCompanyId;
    const isBuyer = order.buyerCompanyId === actorCompanyId;
    if (!isTrader && !isBuyer) {
      return [];
    }
    const ups = await this.prisma.order.findMany({
      where: {
        downstreamOrderId: order.id,
        status: { not: OrderStatus.Cancelled },
      },
      include: { seller: true, items: true },
    });
    const quoted = await this.orderIdsWithSellerQuote(ups);
    const lanes = await this.prisma.tradeLane.findMany({
      where: {
        traderCompanyId: order.sellerCompanyId,
        buyerCompanyId: order.buyerCompanyId,
        sellerCompanyId: { in: ups.map((up) => up.sellerCompanyId) },
      },
    });
    const laneByMill = new Map(lanes.map((lane) => [lane.sellerCompanyId, lane]));
    const desks = ups.map((up) => {
      const byProduct = new Map(
        up.items
          .filter((item) => item.productId)
          .map((item) => [item.productId as string, item]),
      );
      const lines: OrderMillDeskView['lines'] = [];
      const itemIds: string[] = [];
      for (const parentItem of order.items) {
        if (!parentItem.productId) continue;
        const millItem = byProduct.get(parentItem.productId);
        if (!millItem) continue;
        itemIds.push(parentItem.id);
        lines.push({
          parentItemId: parentItem.id,
          millRate: millItem.rate != null ? Number(millItem.rate) : null,
          millQuantity: millItem.quantity != null ? Number(millItem.quantity) : null,
          millDeclined: millItem.lineStatus === OrderLineStatus.Declined,
        });
      }
      const lane = laneByMill.get(up.sellerCompanyId);
      const reveal = lane?.reveal === true;
      return {
        upstreamOrderId: up.id,
        sellerCompanyId: up.sellerCompanyId,
        sellerName: up.seller.name,
        held: up.upstreamReleasedAt == null,
        passHeld: up.passHeldAt != null,
        reveal,
        revealThreadId:
          reveal && up.upstreamReleasedAt != null && lane?.groupThreadId
            ? lane.groupThreadId
            : null,
        status: up.status,
        itemIds,
        confirmedCount: up.items.filter((item) => item.lineStatus === OrderLineStatus.Confirmed)
          .length,
        declinedCount: up.items.filter((item) => item.lineStatus === OrderLineStatus.Declined)
          .length,
        millQuoted: quoted.has(up.id),
        ticket: (lane?.ticket === TradeLaneTicket.Mill ? 'mill' : 'me') as 'me' | 'mill',
        lines,
      };
    });
    if (isTrader) return desks;
    return desks.filter((desk) => {
      const lane = laneByMill.get(desk.sellerCompanyId);
      return millLaneVisibleToBuyer({
        ticket: lane?.ticket,
        reveal: lane?.reveal,
      });
    });
  }

  /**
   * When Meena accepts the trader quote, released mill hops with rated open lines
   * become confirmed so the mill can dispatch (fulfillment lives on the mill ticket).
   */
  private async passBuyerAcceptToMills(parentId: string, userId: string): Promise<void> {
    const ups = await this.prisma.order.findMany({
      where: {
        downstreamOrderId: parentId,
        upstreamReleasedAt: { not: null },
        passHeldAt: null,
        status: OrderStatus.Requested,
      },
      include: { items: true, seller: true },
    });
    for (const up of ups) {
      const openWithRate = up.items.filter(
        (item) => item.lineStatus === OrderLineStatus.Open && item.rate != null,
      );
      if (openWithRate.length === 0) continue;
      await this.prisma.$transaction([
        this.prisma.orderItem.updateMany({
          where: { id: { in: openWithRate.map((item) => item.id) } },
          data: { lineStatus: OrderLineStatus.Confirmed },
        }),
        this.prisma.order.update({
          where: { id: up.id },
          data: {
            status: OrderStatus.Confirmed,
            confirmedAt: new Date(),
            confirmedByCompanyId: up.buyerCompanyId,
            confirmedByUserId: userId,
            ...this.withActor(userId),
          },
        }),
      ]);
      await this.trail.append({
        orderId: up.id,
        type: OrderTrailType.Confirmed,
        actorCompanyId: up.buyerCompanyId,
        actorUserId: userId,
        summary: 'Buyer accepted quote',
        detail: `${openWithRate.length} design${openWithRate.length === 1 ? '' : 's'}`,
      });
      await this.postOrderCard(
        up.buyerCompanyId,
        up.sellerCompanyId,
        up.buyerCompanyId,
        `Quote accepted`,
        up.id,
        {
          status: OrderStatus.Confirmed,
          itemCount: openWithRate.length,
          event: OrderChatEvent.QuoteAccepted,
          orderLabel: shortOrderLabel(up.id),
          actorRole: 'buyer',
        },
      );
    }
  }

  private async passMillLinesToParent(
    millOrderId: string,
    _actorCompanyId: string,
    userId: string,
  ): Promise<void> {
    const mill = await this.prisma.order.findUnique({
      where: { id: millOrderId },
      include: { items: true, seller: true },
    });
    if (!mill || !shouldPassThrough(mill)) return;
    const parent = await this.prisma.order.findUnique({
      where: { id: mill.downstreamOrderId! },
      include: { items: true, seller: true },
    });
    if (!parent) return;
    let confirmed = 0;
    for (const millItem of mill.items) {
      if (millItem.lineStatus !== OrderLineStatus.Confirmed) continue;
      const parentItemId = matchParentItemId(parent.items, millItem);
      if (!parentItemId) continue;
      await this.prisma.orderItem.update({
        where: { id: parentItemId },
        data: {
          quantity: millItem.quantity,
          lineStatus: OrderLineStatus.Confirmed,
        },
      });
      confirmed += 1;
    }
    if (confirmed === 0) return;
    const refreshed = await this.prisma.order.findUnique({
      where: { id: parent.id },
      include: { items: true },
    });
    if (!refreshed) return;
    const stillOpen = refreshed.items.some((item) => item.lineStatus === OrderLineStatus.Open);
    const anyConfirmed = refreshed.items.some(
      (item) => item.lineStatus === OrderLineStatus.Confirmed,
    );
    if (!stillOpen && anyConfirmed && refreshed.status === OrderStatus.Requested) {
      await this.prisma.order.update({
        where: { id: parent.id },
        data: {
          status: OrderStatus.Confirmed,
          confirmedAt: new Date(),
          confirmedByCompanyId: parent.sellerCompanyId,
          confirmedByUserId: userId,
        },
      });
    }
    // Soft-hide: never put mill shop names on the buyer↔trader ticket.
    const summary = buyerSafePassThroughSummary('confirmed', parent.seller.name);
    await this.trail.append({
      orderId: parent.id,
      type: OrderTrailType.Confirmed,
      actorCompanyId: parent.sellerCompanyId,
      actorUserId: userId,
      summary,
      detail: `${confirmed} design${confirmed === 1 ? '' : 's'}`,
    });
    await this.postOrderCard(
      parent.buyerCompanyId,
      parent.sellerCompanyId,
      parent.sellerCompanyId,
      summary,
      parent.id,
      {
        status: stillOpen ? parent.status : OrderStatus.Confirmed,
        itemCount: confirmed,
        event: OrderChatEvent.LinesDecided,
        orderLabel: shortOrderLabel(parent.id),
        actorLabel: parent.seller.name,
        actorRole: 'seller',
      },
    );
  }

  private async passMillDispatchToParent(
    millOrderId: string,
    actorCompanyId: string,
    userId: string,
    candidates: Array<{ orderItemId: string; quantity: number }>,
  ): Promise<void> {
    const mill = await this.prisma.order.findUnique({
      where: { id: millOrderId },
      include: { items: true, seller: true },
    });
    if (!mill || !shouldPassThrough(mill)) return;
    await this.passMillLinesToParent(millOrderId, actorCompanyId, userId);
    const parent = await this.prisma.order.findUnique({
      where: { id: mill.downstreamOrderId! },
      include: { items: true, seller: true },
    });
    if (!parent) return;
    const mapped: Array<{ orderItemId: string; quantity: number }> = [];
    for (const line of candidates) {
      const millItem = mill.items.find((item) => item.id === line.orderItemId);
      if (!millItem) continue;
      const parentItemId = matchParentItemId(parent.items, millItem);
      if (!parentItemId) continue;
      mapped.push({ orderItemId: parentItemId, quantity: line.quantity });
    }
    if (mapped.length === 0) return;
    await this.prisma.orderShipment.create({
      data: {
        orderId: parent.id,
        dispatchedAt: new Date(),
        dispatchedByUserId: userId,
        items: {
          create: mapped.map((line) => ({
            orderItemId: line.orderItemId,
            quantity: line.quantity,
          })),
        },
      },
    });
    const parentAfter = await this.prisma.order.findUnique({
      where: { id: parent.id },
      include: { items: true, shipments: { include: { items: true } } },
    });
    let parentStatus = parent.status;
    let trailKind: 'dispatched' | 'part_shipped' = 'dispatched';
    if (parentAfter) {
      const shippedByItem = this.shippedTotals(parentAfter);
      const shippable = parentAfter.items.filter(
        (item) => item.lineStatus !== OrderLineStatus.Declined,
      );
      const allOut = shippable.every((item) => {
        const shipped = shippedByItem.get(item.id) ?? 0;
        return shipped + 1e-9 >= item.quantity.toNumber();
      });
      const remaining = shippable.reduce((sum, item) => {
        const shipped = shippedByItem.get(item.id) ?? 0;
        return sum + Math.max(0, item.quantity.toNumber() - shipped);
      }, 0);
      const shippedTotal = shippable.reduce(
        (sum, item) => sum + (shippedByItem.get(item.id) ?? 0),
        0,
      );
      if (allOut && remaining <= 0) {
        parentStatus = OrderStatus.Dispatched;
        trailKind = 'dispatched';
        const days = this.config.get('RETURN_WINDOW_DAYS', { infer: true });
        const closesAt = days > 0 ? new Date(Date.now() + days * DAY_MS) : null;
        await this.prisma.order.update({
          where: { id: parent.id },
          data: {
            status: OrderStatus.Dispatched,
            dispatchedAt: new Date(),
            returnWindowClosesAt: closesAt,
            closedAt: new Date(),
            ...this.withActor(userId),
          },
        });
      } else if (shippedTotal > 0 && remaining > 0) {
        parentStatus = OrderStatus.PartShipped;
        trailKind = 'part_shipped';
        await this.prisma.order.update({
          where: { id: parent.id },
          data: {
            status: OrderStatus.PartShipped,
            ...this.withActor(userId),
          },
        });
      }
    }
    // Soft-hide: never put mill shop names on the buyer↔trader ticket.
    const summary = buyerSafePassThroughSummary(trailKind, parent.seller.name);
    await this.trail.append({
      orderId: parent.id,
      type:
        trailKind === 'part_shipped'
          ? OrderTrailType.PartShipped
          : OrderTrailType.Dispatched,
      actorCompanyId: parent.sellerCompanyId,
      actorUserId: userId,
      summary,
    });
    await this.postOrderCard(
      parent.buyerCompanyId,
      parent.sellerCompanyId,
      parent.sellerCompanyId,
      summary,
      parent.id,
      {
        status: parentStatus,
        itemCount: mapped.length,
        event: OrderChatEvent.OrderDispatched,
        orderLabel: shortOrderLabel(parent.id),
        actorLabel: parent.seller.name,
        actorRole: 'seller',
        partial: trailKind === 'part_shipped',
      },
    );
  }

  private async upstreamSellerNames(order: {
    id: string;
    tradeMode: string;
  }): Promise<string[]> {
    if (order.tradeMode !== OrderTradeMode.Manage) return [];
    const ups = await this.prisma.order.findMany({
      where: { downstreamOrderId: order.id },
      select: { seller: { select: { name: true } } },
    });
    return ups.map((up) => up.seller.name).filter((name) => Boolean(name?.trim()));
  }

  private async passBuyerAmendToMills(parentId: string): Promise<void> {
    const parent = await this.prisma.order.findUnique({
      where: { id: parentId },
      include: { items: true },
    });
    if (!parent || parent.tradeMode !== OrderTradeMode.Manage) return;
    const ups = await this.prisma.order.findMany({
      where: {
        downstreamOrderId: parentId,
        upstreamReleasedAt: { not: null },
        passHeldAt: null,
      },
      include: { items: true },
    });
    for (const up of ups) {
      for (const millItem of up.items) {
        const parentItem = parent.items.find((item) => item.productId === millItem.productId);
        if (!parentItem) continue;
        await this.prisma.orderItem.update({
          where: { id: millItem.id },
          data: { quantity: parentItem.quantity, requestedQuantity: parentItem.quantity },
        });
      }
    }
  }

  private async buildRelatedOrders(
    order: {
      id: string;
      tradeMode: string;
      downstreamOrderId: string | null;
      buyerCompanyId: string;
      sellerCompanyId: string;
    },
    actorCompanyId: string,
  ): Promise<
    Array<{
      id: string;
      role: 'downstream' | 'upstream';
      status: string;
      held?: boolean;
      sellerName: string | null;
      buyerName: string | null;
    }>
  > {
    const related: Array<{
      id: string;
      role: 'downstream' | 'upstream';
      status: string;
      held?: boolean;
      sellerName: string | null;
      buyerName: string | null;
    }> = [];

    if (order.downstreamOrderId) {
      const isSupplierEnd = order.sellerCompanyId === actorCompanyId;
      // Mill hop: no Related portal to the buyer ticket — they only see their lot.
      if (!isSupplierEnd) {
        const down = await this.prisma.order.findUnique({
          where: { id: order.downstreamOrderId },
          include: { buyer: true, seller: true },
        });
        if (down) {
          related.push({
            id: down.id,
            role: 'downstream',
            status: down.status,
            sellerName: down.seller.name,
            buyerName: down.buyer.name,
          });
        }
      }
    }

    // End buyer on Manage parent: no Related / Linked chrome — only the trader hop.
    if (
      order.buyerCompanyId === actorCompanyId &&
      order.tradeMode === OrderTradeMode.Manage
    ) {
      return related;
    }

    const upstreams = await this.prisma.order.findMany({
      where: { downstreamOrderId: order.id },
      include: { buyer: true, seller: true },
    });
    for (const up of upstreams) {
      related.push({
        id: up.id,
        role: 'upstream',
        status: up.status,
        held: up.upstreamReleasedAt == null,
        sellerName: up.seller.name,
        buyerName: up.buyer.name,
      });
    }

    return related;
  }

  /**
   * Mill Settle (qty := shipped) → rewrite matching parent lines.
   * Parent Settled only when **every released** mill subset is complete
   * (one supplier → settle parent; two+ and only one settled → stay part shipped).
   */
  private async passMillSettleToParent(
    millOrderId: string,
    _actorCompanyId: string,
    userId: string,
  ): Promise<void> {
    const mill = await this.prisma.order.findUnique({
      where: { id: millOrderId },
      include: { items: true, seller: true },
    });
    // Settle is terminal — pass even if Hold was on (Hold should not strand the parent).
    if (!mill?.downstreamOrderId || !mill.upstreamReleasedAt) return;
    await this.syncManageParentFromMillSettle(mill.downstreamOrderId, millOrderId, userId);
  }

  /**
   * If every released mill subset is complete but parent still open (stuck Part shipped),
   * close parent as Settled. Fixes tickets settled on the mill before pass-through shipped.
   */
  private async healManageParentIfSubsetsComplete(order: {
    id: string;
    tradeMode: string;
    status: string;
  }): Promise<boolean> {
    if (order.tradeMode !== OrderTradeMode.Manage) return false;
    if (
      order.status === OrderStatus.Settled ||
      order.status === OrderStatus.Dispatched ||
      order.status === OrderStatus.Delivered ||
      order.status === OrderStatus.Cancelled ||
      order.status === OrderStatus.Declined
    ) {
      return false;
    }
    const ups = await this.prisma.order.findMany({
      where: { downstreamOrderId: order.id },
      select: { id: true, status: true, upstreamReleasedAt: true },
    });
    if (ups.length === 0) return false;
    if (!allReleasedSubsetsComplete(ups)) return false;
    try {
      await this.syncManageParentFromMillSettle(order.id, null, null);
    } catch (err) {
      this.logger.warn(
        { err, orderId: order.id },
        'healManageParentIfSubsetsComplete failed',
      );
      return false;
    }
    const after = await this.prisma.order.findUnique({
      where: { id: order.id },
      select: { status: true },
    });
    return after?.status === OrderStatus.Settled;
  }

  private async healManageParentsInList(
    rows: Array<{ id: string; tradeMode: string; status: string }>,
  ): Promise<Set<string>> {
    const candidates = rows.filter(
      (row) =>
        row.tradeMode === OrderTradeMode.Manage &&
        (row.status === OrderStatus.PartShipped || row.status === OrderStatus.Confirmed),
    );
    const healed = new Set<string>();
    for (const row of candidates) {
      if (await this.healManageParentIfSubsetsComplete(row)) healed.add(row.id);
    }
    return healed;
  }

  /** Rewrite parent lines from mill qtys; settle parent when all released subsets are done. */
  private async syncManageParentFromMillSettle(
    parentId: string,
    settledMillOrderId: string | null,
    userId: string | null,
  ): Promise<void> {
    const parent = await this.prisma.order.findUnique({
      where: { id: parentId },
      include: { items: true, seller: true, shipments: { include: { items: true } } },
    });
    if (!parent || parent.tradeMode !== OrderTradeMode.Manage) return;
    if (
      parent.status === OrderStatus.Settled ||
      parent.status === OrderStatus.Dispatched ||
      parent.status === OrderStatus.Delivered ||
      parent.status === OrderStatus.Cancelled ||
      parent.status === OrderStatus.Declined
    ) {
      return;
    }

    const mills = await this.prisma.order.findMany({
      where: { downstreamOrderId: parent.id, upstreamReleasedAt: { not: null } },
      include: { items: true },
    });
    for (const mill of mills) {
      const millDone =
        mill.id === settledMillOrderId ||
        mill.status === OrderStatus.Settled ||
        mill.status === OrderStatus.Dispatched ||
        mill.status === OrderStatus.Delivered;
      if (!millDone) continue;
      for (const millItem of mill.items) {
        const parentItemId = matchParentItemId(parent.items, millItem);
        if (!parentItemId) continue;
        const qty = millItem.quantity.toNumber();
        if (qty <= 0) {
          await this.prisma.orderItem.update({
            where: { id: parentItemId },
            data: { quantity: 0, lineStatus: OrderLineStatus.Declined },
          });
        } else {
          await this.prisma.orderItem.update({
            where: { id: parentItemId },
            data: { quantity: qty, lineStatus: OrderLineStatus.Dispatched },
          });
        }
      }
    }

    const upsWithId = await this.prisma.order.findMany({
      where: { downstreamOrderId: parent.id },
      select: { id: true, status: true, upstreamReleasedAt: true },
    });
    const subsetStates = upsWithId.map((up) => ({
      upstreamReleasedAt: up.upstreamReleasedAt,
      status:
        settledMillOrderId && up.id === settledMillOrderId
          ? OrderStatus.Settled
          : up.status,
    }));

    if (!allReleasedSubsetsComplete(subsetStates)) {
      const parentAfter = await this.prisma.order.findUnique({
        where: { id: parent.id },
        include: { items: true, shipments: { include: { items: true } } },
      });
      if (!parentAfter) return;
      const shippedByItem = this.shippedTotals(parentAfter);
      const shippable = parentAfter.items.filter(
        (item) => item.lineStatus !== OrderLineStatus.Declined,
      );
      const remaining = shippable.reduce((sum, item) => {
        const shipped = shippedByItem.get(item.id) ?? 0;
        return sum + Math.max(0, item.quantity.toNumber() - shipped);
      }, 0);
      const shippedTotal = shippable.reduce(
        (sum, item) => sum + (shippedByItem.get(item.id) ?? 0),
        0,
      );
      if (
        shippedTotal > 0 &&
        remaining > 0 &&
        (parentAfter.status === OrderStatus.Confirmed ||
          parentAfter.status === OrderStatus.PartShipped)
      ) {
        await this.prisma.order.update({
          where: { id: parent.id },
          data: {
            status: OrderStatus.PartShipped,
            ...(userId ? this.withActor(userId) : {}),
          },
        });
      }
      return;
    }

    const now = new Date();
    const days = this.config.get('RETURN_WINDOW_DAYS', { infer: true });
    const closesAt = days > 0 ? new Date(Date.now() + days * DAY_MS) : null;
    await this.prisma.order.update({
      where: { id: parent.id },
      data: {
        status: OrderStatus.Settled,
        settledAt: now,
        settledByUserId: userId,
        returnWindowClosesAt: closesAt,
        closedAt: now,
        ...(userId ? this.withActor(userId) : {}),
      },
    });
    // Side effects must not undo / block the Settled write (heal + mill pass-through).
    try {
      await this.trail.append({
        orderId: parent.id,
        type: OrderTrailType.Settled,
        at: now,
        actorCompanyId: parent.sellerCompanyId,
        actorUserId: userId,
        summary: `${parent.seller.name} settled`,
        detail: 'Closed on shipped qty',
      });
      await this.postOrderCard(
        parent.buyerCompanyId,
        parent.sellerCompanyId,
        parent.sellerCompanyId,
        `${parent.seller.name} settled`,
        parent.id,
        {
          status: OrderStatus.Settled,
          event: OrderChatEvent.OrderSettled,
          orderLabel: shortOrderLabel(parent.id),
          actorLabel: parent.seller.name,
          actorRole: 'seller',
          partial: false,
        },
      );
      if (closesAt) {
        await this.jobs.enqueue(JobType.ReturnWindowExpire, { orderId: parent.id }, closesAt);
      }
      this.events.orderStatusChanged({
        orderId: parent.id,
        buyerCompanyId: parent.buyerCompanyId,
        sellerCompanyId: parent.sellerCompanyId,
        actorCompanyId: parent.sellerCompanyId,
        status: OrderStatus.Settled,
        facilitatorCompanyId: parent.facilitatorCompanyId,
      });
    } catch (err) {
      this.logger.warn(
        { err, orderId: parent.id },
        'syncManageParentFromMillSettle side effects failed after Settled write',
      );
    }
  }

  private async spawnHandleUpstreams(
    handlerCompanyId: string,
    userId: string,
    downstreamId: string,
    dto: CreateOrderDto,
  ): Promise<void> {
    const productIds = [
      ...new Set(dto.items.map((item) => item.productId).filter((id): id is string => Boolean(id))),
    ];
    if (productIds.length === 0) return;
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, companyId: true },
    });
    const groups = new Map<string, CreateOrderDto['items']>();
    const byId = new Map(products.map((product) => [product.id, product]));
    for (const item of dto.items) {
      if (!item.productId) continue;
      const product = byId.get(item.productId);
      if (!product || product.companyId === handlerCompanyId) continue;
      const bucket = groups.get(product.companyId) ?? [];
      bucket.push(item);
      groups.set(product.companyId, bucket);
    }
    const shortId = downstreamId.slice(-6).toUpperCase();
    const parent = await this.prisma.order.findUnique({
      where: { id: downstreamId },
      select: { buyerCompanyId: true },
    });
    for (const [sellerCompanyId, items] of groups) {
      try {
        if (parent) {
          await this.upsertTradeLane(handlerCompanyId, sellerCompanyId, parent.buyerCompanyId);
        }
        await this.create(
          handlerCompanyId,
          userId,
          {
            sellerCompanyId,
            kind: dto.kind,
            intent: dto.intent ?? OrderIntent.Order,
            note: dto.note ? `${dto.note} (for #${shortId})` : `For order #${shortId}`,
            items,
          },
          { downstreamOrderId: downstreamId, holdUntilSend: true },
        );
      } catch {
        // Phase A: downstream stays; trader retries upstream later.
      }
    }
  }

  private async upsertTradeLane(
    traderCompanyId: string,
    sellerCompanyId: string,
    buyerCompanyId: string,
    patch: { reveal?: boolean; ticket?: string } = {},
  ) {
    return this.prisma.tradeLane.upsert({
      where: {
        traderCompanyId_sellerCompanyId_buyerCompanyId: {
          traderCompanyId,
          sellerCompanyId,
          buyerCompanyId,
        },
      },
      create: {
        traderCompanyId,
        sellerCompanyId,
        buyerCompanyId,
        ticket: patch.ticket === TradeLaneTicket.Mill ? TradeLaneTicket.Mill : TradeLaneTicket.Me,
        reveal: patch.reveal ?? false,
      },
      update: {
        ...(patch.reveal !== undefined ? { reveal: patch.reveal } : {}),
        ...(patch.ticket !== undefined ? { ticket: patch.ticket } : {}),
      },
    });
  }

  /** Prefer TradeLane over client stamp; missing lane = I handle. */
  private async applyTradeLanePlacePath(
    buyerCompanyId: string,
    dto: CreateOrderDto,
  ): Promise<CreateOrderDto> {
    if (dto.facilitatorCompanyId && dto.sellerCompanyId !== dto.facilitatorCompanyId) {
      const path = await this.pathForPair(
        dto.facilitatorCompanyId,
        dto.sellerCompanyId,
        buyerCompanyId,
      );
      if (path === 'handle') {
        return {
          ...dto,
          sellerCompanyId: dto.facilitatorCompanyId,
          orderPathPreference: 'handle',
          facilitatorCompanyId: undefined,
        };
      }
      return dto;
    }

    if (dto.orderPathPreference === 'handle') {
      const productIds = dto.items
        .map((item) => item.productId)
        .filter((id): id is string => Boolean(id));
      if (productIds.length === 0) return dto;
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { companyId: true },
      });
      const owners = [
        ...new Set(
          products.map((row) => row.companyId).filter((id) => id !== dto.sellerCompanyId),
        ),
      ];
      if (owners.length !== 1) return dto;
      const millId = owners[0]!;
      const path = await this.pathForPair(dto.sellerCompanyId, millId, buyerCompanyId);
      if (path === 'direct') {
        return {
          ...dto,
          sellerCompanyId: millId,
          facilitatorCompanyId: dto.sellerCompanyId,
          orderPathPreference: undefined,
        };
      }
    }

    return dto;
  }

  private async pathForPair(
    traderCompanyId: string,
    sellerCompanyId: string,
    buyerCompanyId: string,
  ): Promise<'handle' | 'direct'> {
    const lane = await this.prisma.tradeLane.findUnique({
      where: {
        traderCompanyId_sellerCompanyId_buyerCompanyId: {
          traderCompanyId,
          sellerCompanyId,
          buyerCompanyId,
        },
      },
      select: { ticket: true },
    });
    return effectivePathFromLane(lane?.ticket);
  }

  /** Prefer TradeLane trio for released mill subset cards when reveal On; main ticket never. */
  private async resolveOrderCardThread(
    buyerCompanyId: string,
    sellerCompanyId: string,
    orderId: string,
  ): Promise<string> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        tradeMode: true,
        buyerCompanyId: true,
        sellerCompanyId: true,
        downstreamOrderId: true,
        upstreamReleasedAt: true,
      },
    });
    if (!order) {
      return this.threads.ensureTradeThread(buyerCompanyId, sellerCompanyId);
    }

    if (order.downstreamOrderId && order.upstreamReleasedAt) {
      const parent = await this.prisma.order.findUnique({
        where: { id: order.downstreamOrderId },
        select: { buyerCompanyId: true },
      });
      if (parent) {
        const lane = await this.prisma.tradeLane.findUnique({
          where: {
            traderCompanyId_sellerCompanyId_buyerCompanyId: {
              traderCompanyId: order.buyerCompanyId,
              sellerCompanyId: order.sellerCompanyId,
              buyerCompanyId: parent.buyerCompanyId,
            },
          },
        });
        if (
          isReleasedMillSubset(order) &&
          shouldRouteToTrio({
            reveal: Boolean(lane?.reveal),
            millReleased: true,
          }) &&
          lane
        ) {
          const threadId = await this.threads.ensureTradeLaneGroup(
            lane.traderCompanyId,
            lane.sellerCompanyId,
            lane.buyerCompanyId,
            lane.groupThreadId,
          );
          if (threadId !== lane.groupThreadId) {
            await this.prisma.tradeLane.update({
              where: { id: lane.id },
              data: { groupThreadId: threadId },
            });
          }
          return threadId;
        }
      }
    }

    // Manage parent (main ticket) always stays on buyer↔trader 1:1 — never the trio.
    return this.threads.ensureTradeThread(buyerCompanyId, sellerCompanyId);
  }

  private async snapshotItems(
    dto: CreateOrderDto,
    opts: { allowForeignProducts?: boolean } = {},
  ): Promise<Prisma.OrderItemCreateWithoutOrderInput[]> {
    if (dto.kind === OrderKind.Photo) {
      return dto.items.map((item) => ({
        productId: null,
        name: item.name ?? 'Photo request',
        sku: null,
        rate: null,
        unit: item.unit ?? null,
        image: item.images?.[0] ?? null,
        images: item.images ?? [],
        quantity: item.quantity,
        requestedQuantity: item.quantity,
        lineStatus: OrderLineStatus.Open,
        note: item.note ?? null,
      }));
    }

    const productIds = dto.items
      .map((item) => item.productId)
      .filter((id): id is string => Boolean(id));
    const products = await this.prisma.product.findMany({
      where: opts.allowForeignProducts
        ? { id: { in: productIds } }
        : { id: { in: productIds }, companyId: dto.sellerCompanyId },
    });
    const byId = new Map(products.map((product) => [product.id, product]));

    return dto.items.map((item) => {
      const product = item.productId ? byId.get(item.productId) : undefined;
      if (!product) {
        throw new NotFoundException({
          code: 'INVALID_ITEM',
          message: opts.allowForeignProducts
            ? 'One or more designs could not be found.'
            : 'One or more products do not belong to this seller.',
        });
      }
      return {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        rate: product.rate,
        unit: product.unit ?? item.unit ?? null,
        image: product.images[0] ?? null,
        images: product.images,
        quantity: item.quantity,
        requestedQuantity: item.quantity,
        lineStatus: OrderLineStatus.Open,
        note: item.note ?? null,
      };
    });
  }
}

function exceptionCode(err: unknown): string {
  if (err instanceof HttpException) {
    const body = err.getResponse();
    if (body && typeof body === 'object' && 'code' in body && typeof (body as { code: unknown }).code === 'string') {
      return (body as { code: string }).code;
    }
    return `HTTP_${err.getStatus()}`;
  }
  return 'ORDER_FAILED';
}

function exceptionMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpException) {
    const body = err.getResponse();
    if (typeof body === 'string') return body;
    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message: unknown }).message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message)) return message.filter((part) => typeof part === 'string').join(' ');
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
