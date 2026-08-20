import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import {
  JobType,
  MessageType,
  OrderChatEvent,
  OrderIntent,
  OrderKind,
  OrderLineStatus,
  OrderStatus,
  OrderTradeMode,
  shortOrderLabel,
  type AmendOrderDto,
  type CreateOrderDto,
  type CreateOrdersBatchDto,
  type CreateOrdersBatchResult,
  type CreateOrdersFromPackDto,
  type CreateOrdersFromPackResult,
  type CursorPage,
  type DecideOrderLinesDto,
  type DispatchDto,
  type ListOrdersQuery,
  type OrderView,
  type QuoteOrderDto,
} from '@ekum/domain-types';
import type { Env } from '../core/config/config.schema';
import { PrismaService } from '../core/prisma/prisma.service';
import { cursorArgs, toCursorPage } from '../discovery/pagination';
import { createdAtRangeFilter } from '../common/audit';
import { JobQueue } from '../jobs/job-queue.service';
import { ThreadService } from '../conversation/thread.service';
import { resolveTradePresence } from '../identity/trade-presence';
import { OrderSerializer } from './order.serializer';
import { TradeAccess } from './trade-access';
import { DomainEvents } from '../events/events.module';

const ORDER_RELATIONS = {
  buyer: true,
  seller: true,
  items: true,
  createdByUser: { select: { id: true, name: true } },
  updatedByUser: { select: { id: true, name: true } },
  shipments: {
    orderBy: { dispatchedAt: 'desc' as const },
    include: { items: { include: { orderItem: { select: { id: true, name: true } } } } },
  },
} as const;

const DAY_MS = 86_400_000;

type CreateOrderOptions = {
  tradeMode?: string;
  facilitatorCompanyId?: string | null;
  downstreamOrderId?: string | null;
  allowForeignProducts?: boolean;
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
  data?: Prisma.OrderUpdateInput;
}

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serializer: OrderSerializer,
    private readonly tradeAccess: TradeAccess,
    private readonly events: DomainEvents,
    private readonly config: ConfigService<Env, true>,
    private readonly jobs: JobQueue,
    private readonly threads: ThreadService,
  ) {}

  async create(
    actorCompanyId: string,
    userId: string,
    dto: CreateOrderDto,
    options: CreateOrderOptions = {},
  ): Promise<OrderView> {
    await this.tradeAccess.assertCanTrade(actorCompanyId, dto.sellerCompanyId, {
      productIds: dto.items
        .map((item) => item.productId)
        .filter((id): id is string => Boolean(id)),
    });
    const items = await this.snapshotItems(dto, {
      allowForeignProducts: options.allowForeignProducts === true,
    });

    const intent = dto.intent ?? OrderIntent.Order;
    const inquiry = intent === OrderIntent.Inquiry;
    const tradeMode = options.tradeMode ?? OrderTradeMode.Bilateral;
    const order = await this.prisma.order.create({
      data: {
        kind: dto.kind,
        intent,
        status: OrderStatus.Requested,
        tradeMode,
        facilitatorCompanyId: options.facilitatorCompanyId ?? null,
        downstreamOrderId: options.downstreamOrderId ?? null,
        buyerCompanyId: actorCompanyId,
        sellerCompanyId: dto.sellerCompanyId,
        createdByCompanyId: actorCompanyId,
        createdByUserId: userId,
        updatedByUserId: userId,
        note: dto.note ?? null,
        items: { create: items },
      },
      include: ORDER_RELATIONS,
    });

    const threadId = await this.threads.ensureTradeThread(actorCompanyId, dto.sellerCompanyId);
    const orderLabel = shortOrderLabel(order.id, { inquiry });
    const actorLabel = order.buyer.name;
    const event = inquiry ? OrderChatEvent.RateRequested : OrderChatEvent.OrderRequested;
    await this.upsertOrderThreadMessage(
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
      },
      MessageType.OrderCard,
    );

    this.events.orderCreated({
      orderId: order.id,
      buyerCompanyId: order.buyerCompanyId,
      sellerCompanyId: order.sellerCompanyId,
    });
    return this.serializer.toOrderView(order, actorCompanyId, threadId);
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
        const order = await this.create(actorCompanyId, userId, {
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
        });
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
        message: 'Use Order for a curated pack.',
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
          { downstreamOrderId: downstream.id },
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
    const snapshots = await this.snapshotItems({
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
    });

    await this.prisma.order.update({
      where: { id },
      data: {
        amendCount: { increment: 1 },
        note: dto.note !== undefined ? dto.note : undefined,
        items: {
          deleteMany: {},
          create: snapshots,
        },
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

    const threadId = await this.threads.findDirectThreadId(
      order.buyerCompanyId,
      order.sellerCompanyId,
    );
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
              ],
            };
    const filters: Prisma.OrderWhereInput[] = [partyWhere];
    if (query.status) filters.push({ status: query.status });
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
    const listWhere: Prisma.OrderWhereInput =
      filters.length === 1 ? filters[0]! : { AND: filters };

    const rows = await this.prisma.order.findMany({
      where: listWhere,
      include: ORDER_RELATIONS,
      ...cursorArgs(query),
    });
    const quotedIds = await this.orderIdsWithSellerQuote(rows);
    return toCursorPage(rows, query.limit, (row) => {
      const sellerQuoted = quotedIds.has(row.id);
      return {
        ...this.serializer.toOrderView(row, actorCompanyId),
        hasSellerQuote: sellerQuoted,
        canAcceptQuote: this.buyerCanAcceptQuoteSync(row, actorCompanyId, sellerQuoted),
      };
    });
  }

  async get(actorCompanyId: string, id: string): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId, true);
    const threadId = await this.threads.findDirectThreadId(
      order.buyerCompanyId,
      order.sellerCompanyId,
    );
    const view = this.serializer.toOrderView(order, actorCompanyId, threadId);
    const sellerQuoted = await this.hasSellerQuote(order.id, order.sellerCompanyId);
    return {
      ...view,
      canAmend: await this.buyerCanAmend(order, actorCompanyId),
      hasSellerQuote: sellerQuoted,
      canAcceptQuote: this.buyerCanAcceptQuoteSync(order, actorCompanyId, sellerQuoted),
    };
  }

  async confirm(actorCompanyId: string, id: string): Promise<OrderView> {
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
          ...this.firmInquiryData(order.intent),
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
    return this.emitAndGet(actorCompanyId, id, OrderStatus.Confirmed);
  }

  async acceptQuote(actorCompanyId: string, id: string): Promise<OrderView> {
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
          ...this.firmInquiryData(order.intent),
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
    return this.emitAndGet(actorCompanyId, id, OrderStatus.Confirmed);
  }

  async quote(actorCompanyId: string, id: string, dto: QuoteOrderDto): Promise<OrderView> {
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
      },
      MessageType.Rate,
    );

    if (order.intent === OrderIntent.Inquiry) {
      await this.prisma.order.update({
        where: { id },
        data: { intent: OrderIntent.Order },
      });
    }

    return this.get(actorCompanyId, id);
  }

  async decideLines(
    actorCompanyId: string,
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
        data: { status: OrderStatus.Declined, closedAt: new Date() },
      });
    } else if (!stillOpen && anyConfirmed) {
      nextStatus = OrderStatus.Confirmed;
      await this.prisma.order.update({
        where: { id },
        data: {
          status: OrderStatus.Confirmed,
          confirmedAt: new Date(),
          confirmedByCompanyId: actorCompanyId,
          ...firmInquiry,
        },
      });
    } else if (Object.keys(firmInquiry).length > 0) {
      await this.prisma.order.update({
        where: { id },
        data: firmInquiry,
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
      return this.emitAndGet(actorCompanyId, id, nextStatus);
    }
    return this.get(actorCompanyId, id);
  }

  async decline(actorCompanyId: string, id: string): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    await this.transition(actorCompanyId, id, {
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
    await this.postOrderCard(
      order.buyerCompanyId,
      order.sellerCompanyId,
      actorCompanyId,
      `${actorLabel} declined`,
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
    return this.get(actorCompanyId, id);
  }

  async dispatch(actorCompanyId: string, id: string, dto: DispatchDto): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    if (order.sellerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only the seller can do this.',
      });
    }
    if (order.status !== OrderStatus.Confirmed) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: 'Only a confirmed order can be dispatched.',
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

    if (allOut && !hasConfirmed) {
      await this.prisma.order.update({
        where: { id },
        data: {
          status: OrderStatus.Dispatched,
          dispatchedAt: now,
          transporter: dto.transporter ?? order.transporter,
          lrNumber: dto.lrNumber ?? order.lrNumber,
          parcelCount: dto.parcelCount ?? order.parcelCount,
        },
      });
      await this.postOrderCard(
        order.buyerCompanyId,
        order.sellerCompanyId,
        actorCompanyId,
        `${actorLabel} dispatched${lrNote}`,
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
      return this.emitAndGet(actorCompanyId, id, OrderStatus.Dispatched);
    }

    // Partial ship — stay confirmed; keep legacy dispatch fields on latest LR for list UIs.
    await this.prisma.order.update({
      where: { id },
      data: {
        transporter: dto.transporter ?? order.transporter,
        lrNumber: dto.lrNumber ?? order.lrNumber,
        parcelCount: dto.parcelCount ?? order.parcelCount,
      },
    });
    await this.postOrderCard(
      order.buyerCompanyId,
      order.sellerCompanyId,
      actorCompanyId,
      `${actorLabel} dispatched part${lrNote}`,
      id,
      {
        status: OrderStatus.Confirmed,
        itemCount: candidates.length,
        event: OrderChatEvent.OrderDispatched,
        orderLabel,
        actorLabel,
        actorRole: 'seller',
        partial: true,
        lrNumber: dto.lrNumber ?? null,
      },
    );
    return this.get(actorCompanyId, id);
  }

  async deliver(actorCompanyId: string, id: string): Promise<OrderView> {
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
    const view = await this.transition(actorCompanyId, id, {
      actor: 'buyer',
      from: [OrderStatus.Dispatched],
      next: OrderStatus.Delivered,
      data: { deliveredAt: new Date(), returnWindowClosesAt: closesAt },
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
    if (closesAt) {
      await this.jobs.enqueue(JobType.ReturnWindowExpire, { orderId: id }, closesAt);
    }
    return view;
  }

  async cancel(actorCompanyId: string, id: string): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    const view = await this.transition(actorCompanyId, id, {
      actor: 'buyer',
      from: [OrderStatus.Requested, OrderStatus.Confirmed],
      next: OrderStatus.Cancelled,
      data: { closedAt: new Date() },
    });
    const orderLabel = shortOrderLabel(id);
    const actorLabel = order.buyer.name;
    await this.postOrderCard(
      order.buyerCompanyId,
      order.sellerCompanyId,
      actorCompanyId,
      `${actorLabel} cancelled`,
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
  ): Promise<void> {
    await this.upsertOrderThreadMessage(
      buyerCompanyId,
      sellerCompanyId,
      senderCompanyId,
      body,
      orderId,
      metadata,
      MessageType.OrderCard,
    );
  }

  private async upsertOrderThreadMessage(
    buyerCompanyId: string,
    sellerCompanyId: string,
    senderCompanyId: string,
    body: string,
    orderId: string,
    metadata: Record<string, unknown>,
    type: typeof MessageType.OrderCard | typeof MessageType.Rate,
  ): Promise<void> {
    const threadId = await this.threads.ensureTradeThread(buyerCompanyId, sellerCompanyId);
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

    if (existing) {
      await this.prisma.message.update({
        where: { id: existing.id },
        data: {
          senderCompanyId,
          type,
          body,
          metadata: nextMeta as Prisma.InputJsonValue,
        },
      });
    } else {
      await this.prisma.message.create({
        data: {
          threadId,
          senderCompanyId,
          type,
          body,
          referenceId: orderId,
          metadata: nextMeta as Prisma.InputJsonValue,
        },
      });
    }
    await this.prisma.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
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
    });
    // Same live flags as get() so mutation responses stay honest for CTAs.
    return this.get(actorCompanyId, id);
  }

  private async transition(
    actorCompanyId: string,
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
      data: { status: options.next, ...options.data },
      include: ORDER_RELATIONS,
    });
    this.events.orderStatusChanged({
      orderId: updated.id,
      buyerCompanyId: updated.buyerCompanyId,
      sellerCompanyId: updated.sellerCompanyId,
      actorCompanyId,
      status: options.next,
    });
    const threadId = await this.threads.findDirectThreadId(
      updated.buyerCompanyId,
      updated.sellerCompanyId,
    );
    return this.serializer.toOrderView(updated, actorCompanyId, threadId);
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
    if (!order || (order.buyerCompanyId !== actorCompanyId && order.sellerCompanyId !== actorCompanyId)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }
    return order;
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
