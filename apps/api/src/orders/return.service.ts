import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  ReturnStatus,
  type ApproveReturnDto,
  type CreateReturnDto,
  type CursorPage,
  type EscalateReturnDto,
  type ListReturnsQuery,
  type ReturnView,
} from '@ekum/domain-types';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { cursorArgs, toCursorPage } from '../discovery/pagination';
import { OrderSerializer } from './order.serializer';
import { DomainEvents } from '../events/events.module';

const RETURN_RELATIONS = {
  items: true,
  order: { include: { buyer: true, seller: true } },
} as const;

@Injectable()
export class ReturnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serializer: OrderSerializer,
    private readonly audit: AuditService,
    private readonly events: DomainEvents,
  ) {}

  async list(actorCompanyId: string, query: ListReturnsQuery): Promise<CursorPage<ReturnView>> {
    const where: Prisma.ReturnWhereInput = {};
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

    const rows = await this.prisma.return.findMany({
      where,
      include: RETURN_RELATIONS,
      ...cursorArgs(query),
    });
    return toCursorPage(rows, query.limit, (row) =>
      this.serializer.toReturnView(row, actorCompanyId),
    );
  }

  async create(actorCompanyId: string, dto: CreateReturnDto): Promise<ReturnView> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });
    if (
      !order ||
      (order.buyerCompanyId !== actorCompanyId && order.sellerCompanyId !== actorCompanyId)
    ) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }
    if (order.buyerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only the buyer can raise a return.',
      });
    }
    if (order.status !== OrderStatus.Delivered) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: 'Only delivered orders can be returned.',
      });
    }
    if (order.returnWindowClosesAt && order.returnWindowClosesAt.getTime() < Date.now()) {
      throw new ConflictException({
        code: 'RETURN_WINDOW_CLOSED',
        message: 'The return window for this order has closed.',
      });
    }

    const orderItemById = new Map(order.items.map((item) => [item.id, item]));
    const returnItems = dto.items.map((line) => {
      const orderItem = orderItemById.get(line.orderItemId);
      if (!orderItem) {
        throw new BadRequestException({
          code: 'INVALID_ITEM',
          message: 'A return line does not match this order.',
        });
      }
      if (line.quantity > orderItem.quantity.toNumber()) {
        throw new BadRequestException({
          code: 'INVALID_QUANTITY',
          message: 'A return quantity exceeds the ordered quantity.',
        });
      }
      return { orderItemId: orderItem.id, name: orderItem.name, requestedQuantity: line.quantity };
    });

    const created = await this.prisma.return.create({
      data: {
        orderId: order.id,
        buyerCompanyId: order.buyerCompanyId,
        sellerCompanyId: order.sellerCompanyId,
        reason: dto.reason ?? null,
        status: ReturnStatus.Requested,
        items: { create: returnItems },
      },
      include: RETURN_RELATIONS,
    });
    this.events.returnRequested({
      returnId: created.id,
      orderId: created.orderId,
      buyerCompanyId: created.buyerCompanyId,
      sellerCompanyId: created.sellerCompanyId,
      actorCompanyId,
      status: created.status,
    });
    return this.serializer.toReturnView(created, actorCompanyId);
  }

  async approve(
    actorCompanyId: string,
    id: string,
    dto: ApproveReturnDto,
  ): Promise<ReturnView> {
    const entity = await this.loadForParty(id, actorCompanyId);
    this.assertSeller(entity.sellerCompanyId, actorCompanyId);
    if (entity.status !== ReturnStatus.Requested) {
      throw this.invalidTransition();
    }

    let allInFull = true;
    const updates = entity.items.map((item) => {
      const requested = item.requestedQuantity.toNumber();
      let approved = requested;
      if (dto.items) {
        const match = dto.items.find((line) => line.returnItemId === item.id);
        approved = match ? Math.min(match.approvedQuantity, requested) : 0;
      }
      if (approved < requested) {
        allInFull = false;
      }
      return this.prisma.returnItem.update({
        where: { id: item.id },
        data: { approvedQuantity: approved },
      });
    });

    const status = allInFull ? ReturnStatus.Approved : ReturnStatus.PartiallyApproved;
    await this.prisma.$transaction([
      ...updates,
      this.prisma.return.update({ where: { id }, data: { status, decidedAt: new Date() } }),
    ]);
    await this.audit.record({
      actorCompanyId,
      action: `return.${status}`,
      targetType: 'return',
      targetId: id,
      after: { status },
    });
    this.events.returnDecided({
      returnId: id,
      orderId: entity.orderId,
      buyerCompanyId: entity.buyerCompanyId,
      sellerCompanyId: entity.sellerCompanyId,
      actorCompanyId,
      status,
    });

    return this.view(id, actorCompanyId);
  }

  async decline(actorCompanyId: string, id: string): Promise<ReturnView> {
    const entity = await this.loadForParty(id, actorCompanyId);
    this.assertSeller(entity.sellerCompanyId, actorCompanyId);
    if (entity.status !== ReturnStatus.Requested) {
      throw this.invalidTransition();
    }
    await this.prisma.return.update({
      where: { id },
      data: { status: ReturnStatus.Declined, decidedAt: new Date() },
    });
    await this.audit.record({
      actorCompanyId,
      action: 'return.declined',
      targetType: 'return',
      targetId: id,
      after: { status: ReturnStatus.Declined },
    });
    this.events.returnDecided({
      returnId: id,
      orderId: entity.orderId,
      buyerCompanyId: entity.buyerCompanyId,
      sellerCompanyId: entity.sellerCompanyId,
      actorCompanyId,
      status: ReturnStatus.Declined,
    });
    return this.view(id, actorCompanyId);
  }

  async resolve(actorCompanyId: string, id: string): Promise<ReturnView> {
    const entity = await this.loadForParty(id, actorCompanyId);
    if (
      entity.status !== ReturnStatus.Approved &&
      entity.status !== ReturnStatus.PartiallyApproved
    ) {
      throw this.invalidTransition();
    }
    await this.prisma.return.update({
      where: { id },
      data: { status: ReturnStatus.Resolved, resolvedAt: new Date() },
    });
    return this.view(id, actorCompanyId);
  }

  /**
   * Trader escalation: the seller on this return (a middleman) passes it upstream
   * as a new return against their own purchase order from their supplier, linked
   * back to the downstream return.
   */
  async escalate(
    actorCompanyId: string,
    id: string,
    dto: EscalateReturnDto,
  ): Promise<ReturnView> {
    const downstream = await this.loadForParty(id, actorCompanyId);
    this.assertSeller(downstream.sellerCompanyId, actorCompanyId);

    const upstreamOrder = await this.prisma.order.findUnique({
      where: { id: dto.upstreamOrderId },
      include: { items: true },
    });
    if (
      !upstreamOrder ||
      (upstreamOrder.buyerCompanyId !== actorCompanyId &&
        upstreamOrder.sellerCompanyId !== actorCompanyId)
    ) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Upstream order not found.' });
    }
    if (upstreamOrder.buyerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'You can only escalate against an order you purchased.',
      });
    }

    const upstreamByName = new Map(
      upstreamOrder.items.map((item) => [item.name.toLowerCase(), item]),
    );
    const created = await this.prisma.return.create({
      data: {
        orderId: upstreamOrder.id,
        buyerCompanyId: actorCompanyId,
        sellerCompanyId: upstreamOrder.sellerCompanyId,
        reason: dto.reason ?? downstream.reason,
        status: ReturnStatus.Requested,
        escalatedFromReturnId: downstream.id,
        items: {
          create: downstream.items.map((item) => ({
            orderItemId: upstreamByName.get(item.name.toLowerCase())?.id ?? item.orderItemId,
            name: item.name,
            requestedQuantity: item.requestedQuantity,
          })),
        },
      },
      include: RETURN_RELATIONS,
    });
    await this.audit.record({
      actorCompanyId,
      action: 'return.escalated',
      targetType: 'return',
      targetId: created.id,
      after: { escalatedFromReturnId: downstream.id },
    });
    return this.serializer.toReturnView(created, actorCompanyId);
  }

  async get(actorCompanyId: string, id: string): Promise<ReturnView> {
    return this.view(id, actorCompanyId);
  }

  private async view(id: string, actorCompanyId: string): Promise<ReturnView> {
    const entity = await this.loadForParty(id, actorCompanyId);
    return this.serializer.toReturnView(entity, actorCompanyId);
  }

  private async loadForParty(id: string, actorCompanyId: string) {
    const entity = await this.prisma.return.findUnique({
      where: { id },
      include: RETURN_RELATIONS,
    });
    if (
      !entity ||
      (entity.buyerCompanyId !== actorCompanyId && entity.sellerCompanyId !== actorCompanyId)
    ) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Return not found.' });
    }
    return entity;
  }

  private assertSeller(sellerCompanyId: string, actorCompanyId: string): void {
    if (sellerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only the seller can decide a return.',
      });
    }
  }

  private invalidTransition(): ConflictException {
    return new ConflictException({
      code: 'INVALID_TRANSITION',
      message: 'This return cannot change to that state.',
    });
  }
}
