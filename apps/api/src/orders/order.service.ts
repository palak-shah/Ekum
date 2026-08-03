import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import {
  JobType,
  MessageType,
  OrderKind,
  OrderStatus,
  type CreateOrderDto,
  type CursorPage,
  type DispatchDto,
  type ListOrdersQuery,
  type OrderView,
  type QuoteOrderDto,
} from '@ekum/domain-types';
import type { Env } from '../core/config/config.schema';
import { PrismaService } from '../core/prisma/prisma.service';
import { cursorArgs, toCursorPage } from '../discovery/pagination';
import { JobQueue } from '../jobs/job-queue.service';
import { ThreadService } from '../conversation/thread.service';
import { OrderSerializer } from './order.serializer';
import { TradeAccess } from './trade-access';
import { DomainEvents } from '../events/events.module';

const ORDER_RELATIONS = { buyer: true, seller: true, items: true } as const;
const DAY_MS = 86_400_000;

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

  async create(actorCompanyId: string, dto: CreateOrderDto): Promise<OrderView> {
    await this.tradeAccess.assertCanTrade(actorCompanyId, dto.sellerCompanyId);
    const items = await this.snapshotItems(dto);

    const order = await this.prisma.order.create({
      data: {
        kind: dto.kind,
        status: OrderStatus.Requested,
        buyerCompanyId: actorCompanyId,
        sellerCompanyId: dto.sellerCompanyId,
        createdByCompanyId: actorCompanyId,
        note: dto.note ?? null,
        items: { create: items },
      },
      include: ORDER_RELATIONS,
    });

    const threadId = await this.threads.ensureTradeThread(actorCompanyId, dto.sellerCompanyId);
    await this.prisma.message.create({
      data: {
        threadId,
        senderCompanyId: actorCompanyId,
        type: MessageType.OrderCard,
        body: dto.note ?? 'Order request',
        referenceId: order.id,
        metadata: { status: order.status, itemCount: order.items.length },
      },
    });
    await this.prisma.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });

    this.events.orderCreated({
      orderId: order.id,
      buyerCompanyId: order.buyerCompanyId,
      sellerCompanyId: order.sellerCompanyId,
    });
    return this.serializer.toOrderView(order, actorCompanyId, threadId);
  }

  async list(actorCompanyId: string, query: ListOrdersQuery): Promise<CursorPage<OrderView>> {
    const where: Prisma.OrderWhereInput = {};
    if (query.direction === 'buying') {
      where.buyerCompanyId = actorCompanyId;
    } else if (query.direction === 'selling') {
      where.sellerCompanyId = actorCompanyId;
    } else {
      where.OR = [{ buyerCompanyId: actorCompanyId }, { sellerCompanyId: actorCompanyId }];
    }
    if (query.status) {
      where.status = query.status;
    }

    const rows = await this.prisma.order.findMany({
      where,
      include: ORDER_RELATIONS,
      ...cursorArgs(query),
    });
    return toCursorPage(rows, query.limit, (row) => this.serializer.toOrderView(row, actorCompanyId));
  }

  async get(actorCompanyId: string, id: string): Promise<OrderView> {
    const order = await this.loadForParty(id, actorCompanyId);
    const threadId = await this.threads.findDirectThreadId(
      order.buyerCompanyId,
      order.sellerCompanyId,
    );
    return this.serializer.toOrderView(order, actorCompanyId, threadId);
  }

  confirm(actorCompanyId: string, id: string): Promise<OrderView> {
    return this.transition(actorCompanyId, id, {
      actor: 'seller',
      from: [OrderStatus.Requested],
      next: OrderStatus.Confirmed,
      data: { confirmedAt: new Date() },
    });
  }

  /** Buyer accepts a seller quote — same transition as confirm, different actor. */
  acceptQuote(actorCompanyId: string, id: string): Promise<OrderView> {
    return this.transition(actorCompanyId, id, {
      actor: 'buyer',
      from: [OrderStatus.Requested],
      next: OrderStatus.Confirmed,
      data: { confirmedAt: new Date() },
    });
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
    for (const line of dto.items) {
      const item = byId.get(line.orderItemId);
      if (!item) {
        throw new NotFoundException({
          code: 'INVALID_ITEM',
          message: 'A quote line does not match this order.',
        });
      }
      await this.prisma.orderItem.update({
        where: { id: item.id },
        data: {
          rate: line.rate,
          ...(line.quantity !== undefined ? { quantity: line.quantity } : {}),
        },
      });
    }

    const threadId = await this.threads.ensureTradeThread(
      order.buyerCompanyId,
      order.sellerCompanyId,
    );
    const total = dto.items.reduce((sum, line) => {
      const item = byId.get(line.orderItemId);
      const qty = line.quantity ?? item?.quantity.toNumber() ?? 0;
      return sum + line.rate * qty;
    }, 0);

    await this.prisma.message.create({
      data: {
        threadId,
        senderCompanyId: actorCompanyId,
        type: MessageType.Rate,
        body: dto.note ?? 'Quote',
        referenceId: order.id,
        metadata: {
          status: OrderStatus.Requested,
          itemCount: dto.items.length,
          totalLabel: `₹${total.toLocaleString('en-IN')}`,
          validUntil: dto.validUntil ?? null,
          quoted: true,
        },
      },
    });
    await this.prisma.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });

    return this.get(actorCompanyId, id);
  }

  decline(actorCompanyId: string, id: string): Promise<OrderView> {
    return this.transition(actorCompanyId, id, {
      actor: 'seller',
      from: [OrderStatus.Requested],
      next: OrderStatus.Declined,
      data: { closedAt: new Date() },
    });
  }

  dispatch(actorCompanyId: string, id: string, dto: DispatchDto): Promise<OrderView> {
    return this.transition(actorCompanyId, id, {
      actor: 'seller',
      from: [OrderStatus.Confirmed],
      next: OrderStatus.Dispatched,
      data: {
        dispatchedAt: new Date(),
        transporter: dto.transporter ?? null,
        lrNumber: dto.lrNumber ?? null,
        parcelCount: dto.parcelCount ?? null,
      },
    });
  }

  async deliver(actorCompanyId: string, id: string): Promise<OrderView> {
    const days = this.config.get('RETURN_WINDOW_DAYS', { infer: true });
    const closesAt = days > 0 ? new Date(Date.now() + days * DAY_MS) : null;
    const view = await this.transition(actorCompanyId, id, {
      actor: 'buyer',
      from: [OrderStatus.Dispatched],
      next: OrderStatus.Delivered,
      data: { deliveredAt: new Date(), returnWindowClosesAt: closesAt },
    });
    if (closesAt) {
      await this.jobs.enqueue(JobType.ReturnWindowExpire, { orderId: id }, closesAt);
    }
    return view;
  }

  cancel(actorCompanyId: string, id: string): Promise<OrderView> {
    return this.transition(actorCompanyId, id, {
      actor: 'buyer',
      from: [OrderStatus.Requested, OrderStatus.Confirmed],
      next: OrderStatus.Cancelled,
      data: { closedAt: new Date() },
    });
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

  private async loadForParty(id: string, actorCompanyId: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: ORDER_RELATIONS });
    if (!order || (order.buyerCompanyId !== actorCompanyId && order.sellerCompanyId !== actorCompanyId)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }
    return order;
  }

  private async snapshotItems(dto: CreateOrderDto): Promise<Prisma.OrderItemCreateWithoutOrderInput[]> {
    if (dto.kind === OrderKind.Photo) {
      return dto.items.map((item) => ({
        productId: null,
        name: item.name ?? 'Photo request',
        sku: null,
        rate: null,
        unit: item.unit ?? null,
        image: item.images[0] ?? null,
        images: item.images,
        quantity: item.quantity,
        note: item.note ?? null,
      }));
    }

    const productIds = dto.items
      .map((item) => item.productId)
      .filter((id): id is string => Boolean(id));
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, companyId: dto.sellerCompanyId },
    });
    const byId = new Map(products.map((product) => [product.id, product]));

    return dto.items.map((item) => {
      const product = item.productId ? byId.get(item.productId) : undefined;
      if (!product) {
        throw new NotFoundException({
          code: 'INVALID_ITEM',
          message: 'One or more products do not belong to this seller.',
        });
      }
      return {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        rate: product.rate,
        unit: product.unit ?? item.unit ?? null,
        image: product.images[0] ?? null,
        images: [],
        quantity: item.quantity,
        note: item.note ?? null,
      };
    });
  }
}
