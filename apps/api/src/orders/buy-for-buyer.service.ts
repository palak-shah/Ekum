import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConnectionStatus,
  MembershipRole,
  MessageType,
  OrderChatEvent,
  OrderIntent,
  OrderKind,
  OrderLineStatus,
  OrderStatus,
  OrderTradeMode,
  shortOrderLabel,
  type CreateForBuyerDto,
  type CreateForBuyerResult,
  type OrderInviteView,
  type OrderView,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { ThreadService } from '../conversation/thread.service';
import { DomainEvents } from '../events/events.module';
import { randomToken } from '../common/crypto.util';
import { connectionPairWhere } from '../access/connection-pair';
import { OrderSerializer } from './order.serializer';
import { phoneDigits, phoneVariants } from './order-invite-claim';

const INVITE_MS = 7 * 24 * 60 * 60 * 1000;

const ORDER_INCLUDE = {
  buyer: true,
  seller: true,
  items: true,
  shipments: { include: { items: { include: { orderItem: { select: { id: true, name: true } } } } } },
  returns: { include: { items: true } },
  createdByUser: { select: { id: true, name: true } },
  updatedByUser: { select: { id: true, name: true } },
} as const;

@Injectable()
export class BuyForBuyerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly threads: ThreadService,
    private readonly events: DomainEvents,
    private readonly serializer: OrderSerializer,
  ) {}

  async create(
    actorCompanyId: string,
    userId: string,
    dto: CreateForBuyerDto,
  ): Promise<CreateForBuyerResult> {
    const seller = await this.prisma.company.findUnique({ where: { id: actorCompanyId } });
    if (!seller) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Business not found.' });
    }

    const productIds: string[] = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException({
        code: 'NOT_FOUND',
        message: 'A design is missing.',
      });
    }
    const byId = new Map(products.map((row) => [row.id, row]));

    const buyer = await this.resolveBuyer(actorCompanyId, seller.city, dto);
    const items = dto.items.map((item) => {
      const product = byId.get(item.productId)!;
      return {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        rate: item.rate ?? product.rate,
        unit: product.unit,
        image: product.images[0] ?? null,
        images: product.images,
        quantity: item.quantity,
        requestedQuantity: item.quantity,
        lineStatus: OrderLineStatus.Open,
      };
    });

    const order = await this.prisma.order.create({
      data: {
        kind: OrderKind.Standard,
        intent: OrderIntent.Order,
        status: OrderStatus.Requested,
        tradeMode: OrderTradeMode.Bilateral,
        buyerCompanyId: buyer.companyId,
        sellerCompanyId: actorCompanyId,
        createdByCompanyId: actorCompanyId,
        createdByUserId: userId,
        updatedByUserId: userId,
        note: dto.note ?? null,
        items: { create: items },
      },
      include: ORDER_INCLUDE,
    });

    const threadId = await this.threads.ensureTradeThread(buyer.companyId, actorCompanyId);
    const orderLabel = shortOrderLabel(order.id);
    await this.prisma.message.create({
      data: {
        threadId,
        senderCompanyId: actorCompanyId,
        type: MessageType.OrderCard,
        body: `${seller.name} logged an order`,
        referenceId: order.id,
        metadata: {
          status: order.status,
          itemCount: order.items.length,
          event: OrderChatEvent.OrderRequested,
          orderLabel,
          actorLabel: seller.name,
          actorRole: 'seller',
          createdBySeller: true,
        },
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

    let invitePath: string | null = null;
    if (buyer.invitePhone) {
      const token = randomToken(18);
      await this.prisma.orderAcceptInvite.create({
        data: {
          orderId: order.id,
          token,
          phone: buyer.invitePhone,
          expiresAt: new Date(Date.now() + INVITE_MS),
        },
      });
      invitePath = `/o/${token}`;
    }

    return {
      order: this.serializer.toOrderView(order, actorCompanyId, threadId),
      invitePath,
    };
  }

  async acceptLogged(actorCompanyId: string, userId: string, id: string): Promise<OrderView> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, seller: true, buyer: true },
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
        message: 'Only you can accept this.',
      });
    }
    if (order.createdByCompanyId !== order.sellerCompanyId) {
      throw new BadRequestException({
        code: 'NOT_LOGGED',
        message: 'This is not a logged ticket.',
      });
    }
    if (order.status !== OrderStatus.Requested) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: 'This order is no longer waiting.',
      });
    }

    const openIds = order.items
      .filter((item) => item.lineStatus === OrderLineStatus.Open)
      .map((item) => item.id);
    if (openIds.length === 0) {
      throw new ConflictException({
        code: 'NO_OPEN_LINES',
        message: 'There are no open lines left to accept.',
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
          intent: OrderIntent.Order,
          updatedByUserId: userId,
        },
      }),
      this.prisma.orderAcceptInvite.updateMany({
        where: { orderId: id, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    const threadId = await this.threads.ensureTradeThread(
      order.buyerCompanyId,
      order.sellerCompanyId,
    );
    const existing = await this.prisma.message.findFirst({
      where: {
        threadId,
        referenceId: id,
        type: { in: [MessageType.OrderCard, MessageType.Rate] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, metadata: true },
    });
    const orderLabel = shortOrderLabel(id);
    const body = `${order.buyer.name} accepted`;
    const metadata = {
      status: OrderStatus.Confirmed,
      itemCount: openIds.length,
      event: OrderChatEvent.QuoteAccepted,
      orderLabel,
      actorLabel: order.buyer.name,
      actorRole: 'buyer',
      createdBySeller: true,
    };
    if (existing) {
      await this.prisma.message.update({
        where: { id: existing.id },
        data: { senderCompanyId: actorCompanyId, body, metadata },
      });
    }
    await this.prisma.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });

    this.events.orderStatusChanged({
      orderId: id,
      buyerCompanyId: order.buyerCompanyId,
      sellerCompanyId: order.sellerCompanyId,
      actorCompanyId,
      status: OrderStatus.Confirmed,
    });

    const fresh = await this.prisma.order.findUniqueOrThrow({
      where: { id },
      include: ORDER_INCLUDE,
    });
    return this.serializer.toOrderView(fresh, actorCompanyId, threadId);
  }

  async getInvite(token: string): Promise<OrderInviteView> {
    const invite = await this.prisma.orderAcceptInvite.findUnique({
      where: { token },
      include: {
        order: { include: { seller: true, buyer: true, items: true } },
      },
    });
    if (!invite) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'This link is not valid.' });
    }
    return {
      token,
      sellerName: invite.order.seller.name,
      buyerName: invite.order.buyer.name,
      itemCount: invite.order.items.length,
      status: invite.order.status,
      expired: invite.expiresAt.getTime() < Date.now(),
      used: Boolean(invite.usedAt) || invite.order.status !== OrderStatus.Requested,
    };
  }

  async acceptInvite(actorCompanyId: string, userId: string, token: string): Promise<OrderView> {
    const invite = await this.requireOpenInvite(token);
    await this.assertInvitePhone(userId, invite.phone);
    if (invite.order.buyerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'This link is for another business.',
      });
    }
    return this.acceptLogged(actorCompanyId, userId, invite.orderId);
  }

  async declineInvite(actorCompanyId: string, userId: string, token: string): Promise<OrderView> {
    const invite = await this.requireOpenInvite(token);
    await this.assertInvitePhone(userId, invite.phone);
    if (invite.order.buyerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'This link is for another business.',
      });
    }
    const updated = await this.prisma.order.update({
      where: { id: invite.orderId },
      data: {
        status: OrderStatus.Cancelled,
        closedAt: new Date(),
      },
      include: ORDER_INCLUDE,
    });
    await this.prisma.orderAcceptInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });
    this.events.orderStatusChanged({
      orderId: updated.id,
      buyerCompanyId: updated.buyerCompanyId,
      sellerCompanyId: updated.sellerCompanyId,
      actorCompanyId,
      status: OrderStatus.Cancelled,
    });
    const threadId = await this.threads.ensureTradeThread(
      updated.buyerCompanyId,
      updated.sellerCompanyId,
    );
    return this.serializer.toOrderView(updated, actorCompanyId, threadId);
  }

  private async requireOpenInvite(token: string) {
    const invite = await this.prisma.orderAcceptInvite.findUnique({
      where: { token },
      include: { order: true },
    });
    if (!invite) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'This link is not valid.' });
    }
    if (invite.usedAt || invite.expiresAt.getTime() < Date.now()) {
      throw new ConflictException({
        code: 'EXPIRED',
        message: 'This link has expired.',
      });
    }
    if (invite.order.status !== OrderStatus.Requested) {
      throw new ConflictException({
        code: 'NOT_OPEN',
        message: 'This order is no longer waiting.',
      });
    }
    return invite;
  }

  private async assertInvitePhone(userId: string, invitePhone: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || phoneDigits(user.phone) !== phoneDigits(invitePhone)) {
      throw new ForbiddenException({
        code: 'WRONG_PHONE',
        message: 'Sign in with the phone on this link.',
      });
    }
  }

  private async resolveBuyer(
    actorCompanyId: string,
    sellerCity: string,
    dto: CreateForBuyerDto,
  ): Promise<{ companyId: string; invitePhone: string | null }> {
    if (dto.buyerCompanyId) {
      if (dto.buyerCompanyId === actorCompanyId) {
        throw new BadRequestException({
          code: 'SELF',
          message: 'Choose the other business.',
        });
      }
      await this.assertTradable(actorCompanyId, dto.buyerCompanyId);
      return { companyId: dto.buyerCompanyId, invitePhone: null };
    }

    const phone = phoneDigits(dto.buyerPhone ?? '');
    if (phone.length !== 10) {
      throw new BadRequestException({
        code: 'PHONE',
        message: 'Enter a 10-digit phone.',
      });
    }

    const users = await this.prisma.user.findMany({
      where: { phone: { in: phoneVariants(phone) } },
      include: { memberships: true },
    });
    const user = users[0];
    const existingCompanyId = user?.memberships[0]?.companyId;
    if (existingCompanyId) {
      if (existingCompanyId === actorCompanyId) {
        throw new BadRequestException({
          code: 'SELF',
          message: 'That phone is your business.',
        });
      }
      return { companyId: existingCompanyId, invitePhone: phone };
    }

    const created = await this.prisma.company.create({
      data: {
        name: dto.buyerName!.trim(),
        city: sellerCity || '—',
        canPublish: false,
        canRefer: true,
      },
    });
    if (user) {
      await this.prisma.companyMembership.create({
        data: {
          userId: user.id,
          companyId: created.id,
          role: MembershipRole.Owner,
          contactRole: 'Owner',
        },
      });
    }
    return { companyId: created.id, invitePhone: phone };
  }

  private async assertTradable(actorCompanyId: string, buyerCompanyId: string) {
    const pair = connectionPairWhere(actorCompanyId, buyerCompanyId);
    const blocked = await this.prisma.connection.findUnique({
      where: { companyLowId_companyHighId: pair },
    });
    if (blocked?.status === ConnectionStatus.Blocked) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Business not found.' });
    }
    if (blocked?.status !== ConnectionStatus.Active) {
      throw new BadRequestException({
        code: 'NOT_CONNECTED',
        message: 'Connect with them first, or use name and phone.',
      });
    }
  }
}
