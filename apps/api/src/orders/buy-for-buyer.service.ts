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
  OrderTrailType,
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
import { productCatalogStatusById } from '../catalog/leftover-offer';
import { OrderSerializer } from './order.serializer';
import { OrderService } from './order.service';
import { OrderTrailService } from './order-trail.service';
import { groupForBuyerLines } from './for-buyer-groups';
import { effectivePathFromLane } from './trade-lane';
import { phoneDigits, phoneVariants } from './order-invite-claim';

const INVITE_MS = 7 * 24 * 60 * 60 * 1000;

const ORDER_INCLUDE = {
  buyer: true,
  seller: true,
  items: true,
  shipments: {
    include: {
      items: { include: { orderItem: { select: { id: true, name: true } } } },
      legs: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
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
    private readonly orders: OrderService,
    private readonly trail: OrderTrailService,
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
    const grouped = groupForBuyerLines(dto.items, products, actorCompanyId);

    let first: OrderView | null = null;
    let inviteOrderId: string | null = null;

    if (grouped.own.length > 0) {
      const now = new Date();
      const ownItems = grouped.own.map((item) => {
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
          // Phone-agreed log — auto-confirm; buyer Declines if they do not want it.
          lineStatus: OrderLineStatus.Confirmed,
        };
      });
      const order = await this.prisma.order.create({
        data: {
          kind: OrderKind.Standard,
          intent: OrderIntent.Order,
          status: OrderStatus.Confirmed,
          tradeMode: OrderTradeMode.Bilateral,
          buyerCompanyId: buyer.companyId,
          sellerCompanyId: actorCompanyId,
          createdByCompanyId: actorCompanyId,
          createdByUserId: userId,
          updatedByUserId: userId,
          confirmedAt: now,
          confirmedByCompanyId: actorCompanyId,
          note: dto.note ?? null,
          transporter: dto.transporter?.trim() || null,
          items: { create: ownItems },
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
            status: OrderStatus.Confirmed,
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
      await this.trail.append({
        orderId: order.id,
        type: OrderTrailType.Confirmed,
        actorCompanyId: actorCompanyId,
        actorUserId: userId,
        detail: 'Logged for buyer',
      });

      this.events.orderCreated({
        orderId: order.id,
        buyerCompanyId: order.buyerCompanyId,
        sellerCompanyId: order.sellerCompanyId,
      });
      this.events.orderStatusChanged({
        orderId: order.id,
        buyerCompanyId: order.buyerCompanyId,
        sellerCompanyId: order.sellerCompanyId,
        actorCompanyId,
        status: OrderStatus.Confirmed,
      });
      first = await this.toOrderView(order, actorCompanyId, threadId);
      inviteOrderId = order.id;
    }

    for (const [millId, millItems] of grouped.byMill) {
      const path = await this.pathForPair(actorCompanyId, millId, buyer.companyId);
      const hopItems = millItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        rate: item.rate,
      }));
      const view =
        path === 'direct'
          ? await this.orders.create(
              actorCompanyId,
              userId,
              {
                sellerCompanyId: millId,
                kind: OrderKind.Standard,
                intent: OrderIntent.Order,
                note: dto.note,
                transporter: dto.transporter,
                facilitatorCompanyId: actorCompanyId,
                items: hopItems,
              },
              {
                onBehalfBuyerCompanyId: buyer.companyId,
                skipLanePlace: true,
                tradeMode: OrderTradeMode.Direct,
                facilitatorCompanyId: actorCompanyId,
              },
            )
          : await this.orders.create(
              actorCompanyId,
              userId,
              {
                sellerCompanyId: actorCompanyId,
                kind: OrderKind.Standard,
                intent: OrderIntent.Order,
                orderPathPreference: 'handle',
                note: dto.note,
                transporter: dto.transporter,
                items: hopItems,
              },
              {
                onBehalfBuyerCompanyId: buyer.companyId,
                skipLanePlace: true,
                allowForeignProducts: true,
                tradeMode: OrderTradeMode.Manage,
              },
            );
      first ??= view;
    }

    if (!first) {
      throw new BadRequestException({
        code: 'NOT_FOUND',
        message: 'A design is missing.',
      });
    }

    let invitePath: string | null = null;
    if (buyer.invitePhone && inviteOrderId) {
      const token = randomToken(18);
      await this.prisma.orderAcceptInvite.create({
        data: {
          orderId: inviteOrderId,
          token,
          phone: buyer.invitePhone,
          expiresAt: new Date(Date.now() + INVITE_MS),
        },
      });
      invitePath = `/o/${token}`;
    }

    return {
      order: first,
      invitePath,
    };
  }

  /**
   * Retired: seller-logged tickets auto-confirm on create.
   * Kept so old clients get a clear error instead of a half-applied Accept.
   */
  async acceptLogged(_actorCompanyId: string, _userId: string, _id: string): Promise<OrderView> {
    throw new BadRequestException({
      code: 'ACCEPT_NOT_NEEDED',
      message: 'This ticket does not need Accept. Decline if you do not want it.',
    });
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
      // Confirmed on create is normal — only mark used when the invite was redeemed.
      used: Boolean(invite.usedAt),
    };
  }

  /**
   * Open the ticket (no Accept). Own-catalog logs are confirmed on create.
   * A leftover `requested` ticket is confirmed here so View order is not a
   * silent open of an unconfirmed order.
   */
  async acceptInvite(actorCompanyId: string, userId: string, token: string): Promise<OrderView> {
    const invite = await this.requireOpenInvite(token);
    await this.assertInvitePhone(userId, invite.phone);
    if (invite.order.buyerCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'This link is for another business.',
      });
    }
    if (invite.order.status === OrderStatus.Requested) {
      await this.confirmLoggedInvite(invite.order, actorCompanyId, userId);
    }
    await this.prisma.orderAcceptInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });
    const threadId = await this.threads.ensureTradeThread(
      invite.order.buyerCompanyId,
      invite.order.sellerCompanyId,
    );
    const fresh = await this.prisma.order.findUniqueOrThrow({
      where: { id: invite.orderId },
      include: ORDER_INCLUDE,
    });
    return this.toOrderView(fresh, actorCompanyId, threadId);
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
    return this.toOrderView(updated, actorCompanyId, threadId);
  }

  /**
   * Phone-agreed log that never landed confirmed. Buyer opening the link
   * confirms it — already-confirmed tickets are left unchanged.
   */
  private async confirmLoggedInvite(
    order: { id: string; buyerCompanyId: string; sellerCompanyId: string },
    actorCompanyId: string,
    userId: string,
  ) {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.orderItem.updateMany({
        where: { orderId: order.id, lineStatus: OrderLineStatus.Open },
        data: { lineStatus: OrderLineStatus.Confirmed },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.Confirmed,
          confirmedAt: now,
          confirmedByCompanyId: actorCompanyId,
          confirmedByUserId: userId,
          updatedByUserId: userId,
        },
      }),
    ]);
    await this.trail.append({
      orderId: order.id,
      type: OrderTrailType.Confirmed,
      actorCompanyId,
      actorUserId: userId,
      detail: 'Opened logged order',
    });
    this.events.orderStatusChanged({
      orderId: order.id,
      buyerCompanyId: order.buyerCompanyId,
      sellerCompanyId: order.sellerCompanyId,
      actorCompanyId,
      status: OrderStatus.Confirmed,
    });
  }

  private async toOrderView(
    order: Parameters<OrderSerializer['toOrderView']>[0],
    actorCompanyId: string,
    threadId: string | null = null,
  ) {
    const items = Array.isArray(order.items) ? order.items : [];
    const catalog = await productCatalogStatusById(
      this.prisma,
      items.map((item) => item.productId),
    );
    return this.serializer.toOrderView(order, actorCompanyId, threadId, null, catalog);
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
    const closed =
      invite.order.status === OrderStatus.Cancelled ||
      invite.order.status === OrderStatus.Declined ||
      invite.order.status === OrderStatus.Settled;
    if (closed) {
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

  private async pathForPair(
    traderCompanyId: string,
    millCompanyId: string,
    buyerCompanyId: string,
  ): Promise<'handle' | 'direct'> {
    const lane = await this.prisma.tradeLane.findUnique({
      where: {
        traderCompanyId_sellerCompanyId_buyerCompanyId: {
          traderCompanyId,
          sellerCompanyId: millCompanyId,
          buyerCompanyId,
        },
      },
      select: { ticket: true },
    });
    return effectivePathFromLane(lane?.ticket);
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
