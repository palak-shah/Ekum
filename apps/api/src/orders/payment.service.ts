import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MessageType,
  OrderStatus,
  PaymentRequestStatus,
  shortOrderLabel,
  type CreatePaymentRequestDto,
  type PaymentRequestView,
} from '@ekum/domain-types';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { ThreadService } from '../conversation/thread.service';
import { DomainEvents } from '../events/events.module';

const ASKABLE = new Set<string>([
  OrderStatus.Confirmed,
  OrderStatus.Dispatched,
  OrderStatus.Delivered,
]);

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly threads: ThreadService,
    private readonly events: DomainEvents,
  ) {}

  toView(row: {
    id: string;
    orderId: string;
    amount: Prisma.Decimal | number;
    note: string | null;
    instructions: string | null;
    status: string;
    seenAt: Date | null;
    paidAt: Date | null;
    createdAt: Date;
  }): PaymentRequestView {
    const amount = typeof row.amount === 'number' ? row.amount : row.amount.toNumber();
    return {
      id: row.id,
      orderId: row.orderId,
      amount,
      note: row.note,
      instructions: row.instructions,
      status: row.status,
      seenAt: row.seenAt ? row.seenAt.toISOString() : null,
      paidAt: row.paidAt ? row.paidAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listForOrder(orderId: string): Promise<PaymentRequestView[]> {
    const rows = await this.prisma.paymentRequest.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toView(row));
  }

  async create(
    actorCompanyId: string,
    _userId: string,
    orderId: string,
    dto: CreatePaymentRequestDto,
  ): Promise<PaymentRequestView> {
    const order = await this.requireParty(orderId, actorCompanyId);
    if (order.sellerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only you can ask for payment on this.',
      });
    }
    if (!ASKABLE.has(order.status)) {
      throw new BadRequestException({
        code: 'NOT_READY',
        message: 'Ask after the order is confirmed.',
      });
    }
    const open = await this.prisma.paymentRequest.findFirst({
      where: { orderId, status: PaymentRequestStatus.Open },
    });
    if (open) {
      throw new ConflictException({
        code: 'ASK_OPEN',
        message: 'There is already an open payment ask.',
      });
    }

    const created = await this.prisma.paymentRequest.create({
      data: {
        orderId,
        amount: dto.amount,
        note: dto.note ?? null,
        instructions: dto.instructions ?? null,
        status: PaymentRequestStatus.Open,
      },
    });
    await this.upsertCard(order, created.id, actorCompanyId, dto.amount, PaymentRequestStatus.Open);
    this.events.paymentRequested({
      paymentRequestId: created.id,
      orderId,
      buyerCompanyId: order.buyerCompanyId,
      sellerCompanyId: order.sellerCompanyId,
    });
    return this.toView(created);
  }

  async seen(actorCompanyId: string, id: string): Promise<PaymentRequestView> {
    const { ask, order } = await this.loadAsk(id, actorCompanyId);
    if (order.buyerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only the other side marks this seen.',
      });
    }
    if (ask.status !== PaymentRequestStatus.Open) return this.toView(ask);
    const updated = await this.prisma.paymentRequest.update({
      where: { id },
      data: { seenAt: ask.seenAt ?? new Date() },
    });
    return this.toView(updated);
  }

  async paid(actorCompanyId: string, id: string): Promise<PaymentRequestView> {
    const { ask, order } = await this.loadAsk(id, actorCompanyId);
    if (order.buyerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only you can mark this paid.',
      });
    }
    return this.settle(order, ask, actorCompanyId);
  }

  async received(actorCompanyId: string, id: string): Promise<PaymentRequestView> {
    const { ask, order } = await this.loadAsk(id, actorCompanyId);
    if (order.sellerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only you can mark this received.',
      });
    }
    return this.settle(order, ask, actorCompanyId);
  }

  private async settle(
    order: { id: string; buyerCompanyId: string; sellerCompanyId: string },
    ask: { id: string; amount: Prisma.Decimal; status: string },
    actorCompanyId: string,
  ): Promise<PaymentRequestView> {
    if (ask.status === PaymentRequestStatus.Paid) return this.toView(ask as never);
    if (ask.status !== PaymentRequestStatus.Open) {
      throw new ConflictException({
        code: 'NOT_OPEN',
        message: 'This ask is already closed.',
      });
    }
    const updated = await this.prisma.paymentRequest.update({
      where: { id: ask.id },
      data: { status: PaymentRequestStatus.Paid, paidAt: new Date() },
    });
    await this.upsertCard(
      order,
      ask.id,
      actorCompanyId,
      updated.amount.toNumber(),
      PaymentRequestStatus.Paid,
    );
    this.events.paymentSettled({
      paymentRequestId: ask.id,
      orderId: order.id,
      buyerCompanyId: order.buyerCompanyId,
      sellerCompanyId: order.sellerCompanyId,
      actorCompanyId,
    });
    return this.toView(updated);
  }

  private async upsertCard(
    order: { id: string; buyerCompanyId: string; sellerCompanyId: string },
    paymentRequestId: string,
    senderCompanyId: string,
    amount: number,
    status: string,
  ): Promise<void> {
    const threadId = await this.threads.ensureTradeThread(
      order.buyerCompanyId,
      order.sellerCompanyId,
    );
    const label = shortOrderLabel(order.id);
    const body =
      status === PaymentRequestStatus.Paid
        ? `Payment · ${label} · Paid`
        : `Payment · ${label} · ₹${amount.toLocaleString('en-IN')}`;
    const existing = await this.prisma.message.findFirst({
      where: { threadId, referenceId: paymentRequestId, type: MessageType.PaymentCard },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    const metadata = {
      kind: 'payment',
      status,
      amount,
      orderId: order.id,
      orderLabel: `Payment · ${label}`,
    };
    if (existing) {
      await this.prisma.message.update({
        where: { id: existing.id },
        data: { body, metadata, senderCompanyId },
      });
    } else {
      await this.prisma.message.create({
        data: {
          threadId,
          senderCompanyId,
          type: MessageType.PaymentCard,
          body,
          referenceId: paymentRequestId,
          metadata,
        },
      });
    }
    await this.prisma.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });
  }

  private async requireParty(orderId: string, actorCompanyId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (
      !order ||
      (order.buyerCompanyId !== actorCompanyId && order.sellerCompanyId !== actorCompanyId)
    ) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }
    return order;
  }

  private async loadAsk(id: string, actorCompanyId: string) {
    const ask = await this.prisma.paymentRequest.findUnique({ where: { id } });
    if (!ask) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Payment ask not found.' });
    }
    const order = await this.requireParty(ask.orderId, actorCompanyId);
    return { ask, order };
  }
}
