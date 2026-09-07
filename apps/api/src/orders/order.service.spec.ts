import { describe, expect, it } from 'vitest';
import {
  OrderIntent,
  OrderKind,
  OrderLineStatus,
  OrderStatus,
  OrderTradeMode,
  type CreateOrderDto,
} from '@ekum/domain-types';
import { OrderService } from './order.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { OrderSerializer } from './order.serializer';
import type { TradeAccess } from './trade-access';
import type { DomainEvents } from '../events/events.module';
import type { JobQueue } from '../jobs/job-queue.service';
import type { Env } from '../core/config/config.schema';
import type { ConfigService } from '@nestjs/config';
import type { ThreadService } from '../conversation/thread.service';

const events = {
  orderCreated: () => undefined,
  orderStatusChanged: () => undefined,
  messageSent: () => undefined,
} as unknown as DomainEvents;

const config = {
  get: () => 7,
} as unknown as ConfigService<Env, true>;

const jobs = { enqueue: async () => 'job-1' } as unknown as JobQueue;

const threads = {
  ensureTradeThread: async () => 'thread-1',
  findDirectThreadId: async () => 'thread-1',
  notifyUserIdsForMessage: async () => ({
    companyIds: ['buyer'],
    userIds: ['buyer-user'],
  }),
} as unknown as ThreadService;

const trail = {
  append: async () => undefined,
  listForViewer: async () => [],
  backfillFromOrder: async () => undefined,
} as unknown as import('./order-trail.service').OrderTrailService;

interface Captured {
  createData: { items: { create: Record<string, unknown>[] } } | null;
  updateData: Record<string, unknown> | null;
  messageCreate: Record<string, unknown> | null;
  messageUpdate: Record<string, unknown> | null;
  itemUpdates: Record<string, unknown>[];
  shipmentCreate: Record<string, unknown> | null;
}

interface Options {
  products?: { id: string; name: string; sku: string | null; rate: unknown; unit: string | null; images: string[] }[];
  /** When true, mock finds a seller Rate message for the order (quote sent). */
  sellerQuoted?: boolean;
  order?: {
    id: string;
    status: string;
    intent?: string;
    kind?: string;
    tradeMode?: string;
    buyerCompanyId: string;
    sellerCompanyId: string;
    transporter?: string | null;
    lrNumber?: string | null;
    parcelCount?: number | null;
    items?: {
      id: string;
      quantity: { toNumber: () => number };
      requestedQuantity: { toNumber: () => number };
      lineStatus: string;
      rate?: { toNumber: () => number } | null;
      name?: string;
    }[];
    shipments?: {
      items: { orderItemId: string; quantity: { toNumber: () => number } }[];
    }[];
  } | null;
}

function makeService(options: Options) {
  const captured: Captured = {
    createData: null,
    updateData: null,
    messageCreate: null,
    messageUpdate: null,
    itemUpdates: [],
    shipmentCreate: null,
  };
  let orderState = options.order
    ? {
        ...options.order,
        buyer: { id: options.order.buyerCompanyId, name: 'Buyer' },
        seller: { id: options.order.sellerCompanyId, name: 'Seller' },
        items: options.order.items ?? [],
        shipments: options.order.shipments ?? [],
      }
    : null;
  let livingMessage: {
    id: string;
    type: string;
    metadata: Record<string, unknown> | null;
  } | null = options.sellerQuoted
    ? { id: 'quote-msg', type: 'rate', metadata: { quoted: true, event: 'quote_sent' } }
    : null;

  const prisma = {
    product: {
      findMany: async (args?: { where?: { id?: { in?: string[] }; companyId?: string } }) => {
        const all = options.products ?? [];
        const ids = args?.where?.id?.in;
        const sellerId = args?.where?.companyId;
        return all.filter((product) => {
          if (ids && !ids.includes(product.id)) return false;
          if (sellerId && (product as { companyId?: string }).companyId && (product as { companyId?: string }).companyId !== sellerId) {
            return false;
          }
          // When companyId filter is set and product has no companyId, treat as seller-owned (legacy mocks).
          if (sellerId && !(product as { companyId?: string }).companyId) {
            return true;
          }
          return true;
        });
      },
    },
    order: {
      create: async (args: { data: Captured['createData'] & Record<string, unknown> }) => {
        captured.createData = args.data;
        return {
          id: 'o1',
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          status: OrderStatus.Requested,
          intent: (args.data as { intent?: string }).intent ?? OrderIntent.Order,
          buyer: { id: 'buyer', name: 'Buyer' },
          seller: { id: 'seller', name: 'Seller' },
          items: [{ id: 'oi1' }],
          shipments: [],
        };
      },
      findUnique: async () => orderState,
      findMany: async () => [],
      update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        captured.updateData = args.data;
        if (orderState) {
          orderState = {
            ...orderState,
            status: String(args.data.status ?? orderState.status),
            ...args.data,
          } as typeof orderState;
        }
        return {
          id: args.where.id,
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          buyer: { id: 'buyer', name: 'Buyer' },
          seller: { id: 'seller', name: 'Seller' },
          items: orderState?.items ?? [],
          shipments: orderState?.shipments ?? [],
          status: args.data.status ?? orderState?.status,
        };
      },
    },
    orderItem: {
      update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        captured.itemUpdates.push(args.data);
        if (orderState) {
          orderState = {
            ...orderState,
            items: orderState.items.map((item) =>
              item.id === args.where.id
                ? {
                    ...item,
                    lineStatus: String(args.data.lineStatus ?? item.lineStatus),
                    quantity:
                      args.data.quantity !== undefined
                        ? { toNumber: () => Number(args.data.quantity) }
                        : item.quantity,
                    rate:
                      args.data.rate !== undefined
                        ? { toNumber: () => Number(args.data.rate) }
                        : item.rate,
                  }
                : item,
            ),
          };
        }
        return {};
      },
      updateMany: async (args: { where: { id?: { in: string[] }; orderId?: string; lineStatus?: unknown }; data: Record<string, unknown> }) => {
        if (orderState) {
          const ids = args.where.id?.in;
          orderState = {
            ...orderState,
            items: orderState.items.map((item) => {
              const match = ids ? ids.includes(item.id) : item.lineStatus === OrderLineStatus.Open;
              return match
                ? { ...item, lineStatus: String(args.data.lineStatus ?? item.lineStatus) }
                : item;
            }),
          };
        }
        return { count: 1 };
      },
    },
    orderShipment: {
      create: async (args: { data: Record<string, unknown> }) => {
        captured.shipmentCreate = args.data;
        const data = args.data as {
          items: { create: { orderItemId: string; quantity: number }[] };
        };
        if (orderState) {
          orderState = {
            ...orderState,
            shipments: [
              ...(orderState.shipments ?? []),
              {
                items: data.items.create.map((line) => ({
                  orderItemId: line.orderItemId,
                  quantity: { toNumber: () => line.quantity },
                })),
              },
            ],
          };
        }
        return { id: 'ship-1' };
      },
    },
    message: {
      create: async (args: { data: Record<string, unknown> }) => {
        captured.messageCreate = args.data;
        livingMessage = {
          id: 'msg-living',
          type: String(args.data.type ?? 'order_card'),
          metadata:
            args.data.metadata && typeof args.data.metadata === 'object'
              ? (args.data.metadata as Record<string, unknown>)
              : null,
        };
        return { id: 'msg-living', ...args.data };
      },
      update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        captured.messageUpdate = { id: args.where.id, ...args.data };
        if (livingMessage && livingMessage.id === args.where.id) {
          livingMessage = {
            ...livingMessage,
            type: String(args.data.type ?? livingMessage.type),
            metadata:
              args.data.metadata && typeof args.data.metadata === 'object'
                ? (args.data.metadata as Record<string, unknown>)
                : livingMessage.metadata,
          };
        }
        return livingMessage;
      },
      findFirst: async (args?: {
        where?: {
          threadId?: string;
          referenceId?: string;
          senderCompanyId?: string;
          type?: string | { in?: string[] };
          OR?: unknown[];
        };
      }) => {
        const where = args?.where ?? {};
        // Upsert lookup (trade thread + order reference).
        if (where.threadId && where.referenceId && livingMessage) {
          return { id: livingMessage.id, metadata: livingMessage.metadata };
        }
        // hasSellerQuote (Rate or metadata.quoted).
        if (where.OR && (options.sellerQuoted || livingMessage?.metadata?.quoted)) {
          return { id: livingMessage?.id ?? 'quote-msg' };
        }
        if (where.senderCompanyId && options.sellerQuoted) {
          return { id: 'seller-msg' };
        }
        const type = where.type;
        if (
          options.sellerQuoted &&
          (type === 'rate' ||
            (typeof type === 'object' && Array.isArray(type.in) && type.in.includes('rate')))
        ) {
          return { id: 'quote-msg', metadata: { quoted: true } };
        }
        return null;
      },
      findMany: async () =>
        options.sellerQuoted && options.order
          ? [
              {
                referenceId: options.order.id,
                senderCompanyId: options.order.sellerCompanyId,
                type: 'rate',
                metadata: { quoted: true },
              },
            ]
          : livingMessage?.metadata?.quoted && options.order
            ? [
                {
                  referenceId: options.order.id,
                  senderCompanyId: options.order.sellerCompanyId,
                  type: livingMessage.type,
                  metadata: livingMessage.metadata,
                },
              ]
            : [],
    },
    thread: {
      update: async () => ({}),
    },
    paymentRequest: {
      findMany: async () => [],
    },
    media: {
      findFirst: async (args?: { where?: { id?: string; companyId?: string; kind?: string } }) => {
        if (args?.where?.id === 'media-voice' && args.where.kind === 'audio') {
          return {
            id: 'media-voice',
            companyId: args.where.companyId,
            kind: 'audio',
            url: 'https://host/voice.webm',
          };
        }
        return null;
      },
    },
    $transaction: async (ops: unknown) => {
      if (typeof ops === 'function') {
        return ops(prisma);
      }
      return Promise.all(ops as Promise<unknown>[]);
    },
  } as unknown as PrismaService;
  const serializer = {
    toOrderView: (order: unknown, _actor?: string, threadId?: string | null) => ({
      ...(order as object),
      threadId: threadId ?? null,
    }),
  } as unknown as OrderSerializer;
  const tradeAccess = { assertCanTrade: async () => undefined } as unknown as TradeAccess;
  return {
    service: new OrderService(
      prisma,
      serializer,
      tradeAccess,
      events,
      config,
      jobs,
      threads,
      trail,
    ),
    captured,
    prisma,
  };
}

function openItem(id: string, qty: number, rate: number | null = null) {
  return {
    id,
    name: id,
    quantity: { toNumber: () => qty },
    requestedQuantity: { toNumber: () => qty },
    lineStatus: OrderLineStatus.Open,
    rate: rate == null ? null : { toNumber: () => rate },
  };
}

describe('OrderService.create snapshots', () => {
  it('captures an immutable product snapshot on the order line', async () => {
    const { service, captured } = makeService({
      products: [
        { id: 'p1', name: 'Silk Saree', sku: 'S1', rate: { toNumber: () => 100 }, unit: 'mtr', images: ['img1'] },
      ],
    });
    const dto = {
      sellerCompanyId: 'seller',
      kind: OrderKind.Standard,
      items: [{ productId: 'p1', quantity: 5, images: [] }],
    } as CreateOrderDto;
    await service.create('buyer', 'user-1', dto);
    expect(captured.createData?.items.create[0]).toMatchObject({
      productId: 'p1',
      name: 'Silk Saree',
      sku: 'S1',
      unit: 'mtr',
      image: 'img1',
      quantity: 5,
      requestedQuantity: 5,
      lineStatus: OrderLineStatus.Open,
    });
  });

  it('puts create-order mic note on the living chat card metadata', async () => {
    const { service, captured } = makeService({
      products: [
        { id: 'p1', name: 'Silk Saree', sku: 'S1', rate: { toNumber: () => 100 }, unit: 'mtr', images: [] },
      ],
    });
    await service.create('buyer', 'user-1', {
      sellerCompanyId: 'seller',
      kind: OrderKind.Standard,
      note: 'Need by Friday',
      noteVoiceMediaId: 'media-voice',
      noteVoiceDurationMs: 1800,
      items: [{ productId: 'p1', quantity: 1, images: [] }],
    } as CreateOrderDto);
    expect(captured.messageCreate).toMatchObject({
      body: 'Need by Friday',
      metadata: expect.objectContaining({
        noteVoiceUrl: 'https://host/voice.webm',
        noteVoiceMediaId: 'media-voice',
        noteVoiceDurationMs: 1800,
      }),
    });
  });

  it('posts an order card into the trade thread on create', async () => {
    const { service, captured } = makeService({
      products: [
        { id: 'p1', name: 'Silk Saree', sku: 'S1', rate: { toNumber: () => 100 }, unit: 'mtr', images: [] },
      ],
    });
    await service.create('buyer', 'user-1', {
      sellerCompanyId: 'seller',
      kind: OrderKind.Standard,
      items: [{ productId: 'p1', quantity: 1, images: [] }],
    } as CreateOrderDto);
    expect(captured.messageCreate).toMatchObject({
      threadId: 'thread-1',
      type: 'order_card',
      referenceId: 'o1',
      metadata: expect.objectContaining({
        event: 'order_requested',
        intent: OrderIntent.Order,
      }),
    });
    expect(captured.createData).toMatchObject({ intent: OrderIntent.Order });
  });

  it('creates an inquiry with rate_requested chat card and Inquiry # label', async () => {
    const { service, captured } = makeService({
      products: [
        { id: 'p1', name: 'Silk Saree', sku: 'S1', rate: { toNumber: () => 100 }, unit: 'mtr', images: [] },
      ],
    });
    await service.create('buyer', 'user-1', {
      sellerCompanyId: 'seller',
      kind: OrderKind.Standard,
      intent: OrderIntent.Inquiry,
      items: [{ productId: 'p1', quantity: 10, images: [] }],
    } as CreateOrderDto);
    expect(captured.createData).toMatchObject({ intent: OrderIntent.Inquiry });
    expect(captured.messageCreate).toMatchObject({
      type: 'order_card',
      metadata: expect.objectContaining({
        event: 'rate_requested',
        intent: OrderIntent.Inquiry,
        orderLabel: expect.stringMatching(/^Inquiry #/),
      }),
    });
    expect(String(captured.messageCreate?.body)).toMatch(/asked for rates/i);
  });

  it('lets the buyer amend before the seller responds', async () => {
    const { service, captured } = makeService({
      products: [
        { id: 'p1', name: 'Silk Saree', sku: 'S1', rate: { toNumber: () => 100 }, unit: 'mtr', images: [] },
        { id: 'p2', name: 'Cotton', sku: 'C1', rate: { toNumber: () => 50 }, unit: 'mtr', images: [] },
      ],
      order: {
        id: 'o1',
        status: OrderStatus.Requested,
        intent: OrderIntent.Inquiry,
        kind: OrderKind.Standard,
        buyerCompanyId: 'buyer',
        sellerCompanyId: 'seller',
        items: [openItem('oi1', 10)],
      },
    });
    await service.amend('buyer', 'u1', 'o1', {
      items: [
        { productId: 'p1', quantity: 12, images: [] },
        { productId: 'p2', quantity: 5, images: [] },
      ],
    });
    expect(captured.updateData).toMatchObject({
      amendCount: { increment: 1 },
      items: expect.objectContaining({ deleteMany: {} }),
    });
    expect(captured.messageCreate).toMatchObject({
      type: 'order_card',
      metadata: expect.objectContaining({
        event: 'order_updated',
        orderLabel: expect.stringMatching(/^Inquiry #/),
      }),
    });
  });

  it('lets the buyer amend I-handle lines owned by the mill', async () => {
    const { service, captured } = makeService({
      products: [
        {
          id: 'fab-1',
          name: 'Cotton Grey Fabric',
          sku: 'FAB-CO-01',
          rate: { toNumber: () => 85 },
          unit: 'mtr',
          images: [],
          companyId: 'mill',
        } as {
          id: string;
          name: string;
          sku: string | null;
          rate: unknown;
          unit: string | null;
          images: string[];
          companyId?: string;
        },
      ],
      order: {
        id: 'o1',
        status: OrderStatus.Requested,
        intent: OrderIntent.Order,
        kind: OrderKind.Standard,
        tradeMode: OrderTradeMode.Manage,
        buyerCompanyId: 'buyer',
        sellerCompanyId: 'trader',
        items: [openItem('oi1', 10)],
      },
    });
    await service.amend('buyer', 'u1', 'o1', {
      items: [{ productId: 'fab-1', quantity: 20, images: [] }],
    });
    expect(captured.updateData).toMatchObject({
      amendCount: { increment: 1 },
    });
  });

  it('rejects a line referencing a product not sold by the seller', async () => {
    const { service } = makeService({ products: [] });
    const dto = {
      sellerCompanyId: 'seller',
      kind: OrderKind.Standard,
      items: [{ productId: 'ghost', quantity: 1, images: [] }],
    } as CreateOrderDto;
    await expect(service.create('buyer', 'user-1', dto)).rejects.toThrow();
  });
});

describe('OrderService quote + accept (partial)', () => {
  const requested = {
    id: 'o1',
    status: OrderStatus.Requested,
    buyerCompanyId: 'buyer',
    sellerCompanyId: 'seller',
    items: [openItem('oi1', 50), openItem('oi2', 10)],
  };

  it('lets the seller quote with lower qty and decline a line', async () => {
    const { service, captured } = makeService({ order: requested });
    await service.quote('seller', 'u1', 'o1', {
      items: [
        { orderItemId: 'oi1', rate: 150, quantity: 20 },
        { orderItemId: 'oi2', unavailable: true },
      ],
      note: 'Partial stock',
    });
    expect(captured.messageCreate).toMatchObject({
      type: 'rate',
      referenceId: 'o1',
      body: 'Partial stock',
      metadata: expect.objectContaining({
        partial: true,
        itemCount: 1,
        event: 'quote_sent',
        quoted: true,
      }),
    });
    expect(captured.itemUpdates.some((u) => u.lineStatus === OrderLineStatus.Declined)).toBe(true);
    expect(captured.itemUpdates.some((u) => u.quantity === 20 && u.rate === 150)).toBe(true);
  });

  it('stores quote mic note on the living rate card metadata', async () => {
    const { service, captured } = makeService({ order: requested });
    await service.quote('seller', 'u1', 'o1', {
      items: [{ orderItemId: 'oi1', rate: 150, quantity: 20 }],
      note: 'Mic note',
      noteVoiceMediaId: 'media-voice',
      noteVoiceDurationMs: 1500,
    });
    expect(captured.messageCreate).toMatchObject({
      type: 'rate',
      body: 'Mic note',
      metadata: expect.objectContaining({
        noteVoiceUrl: 'https://host/voice.webm',
        noteVoiceMediaId: 'media-voice',
        noteVoiceDurationMs: 1500,
      }),
    });
  });

  it('updates the same living message when quote follows an existing card', async () => {
    const { service, captured } = makeService({
      sellerQuoted: true,
      order: {
        id: 'o1',
        status: OrderStatus.Requested,
        intent: OrderIntent.Inquiry,
        buyerCompanyId: 'buyer',
        sellerCompanyId: 'seller',
        items: [openItem('oi1', 10)],
      },
    });
    await service.quote('seller', 'u1', 'o1', {
      items: [{ orderItemId: 'oi1', rate: 200, quantity: 8 }],
    });
    expect(captured.messageUpdate).toMatchObject({
      id: 'quote-msg',
      type: 'rate',
      metadata: expect.objectContaining({
        event: 'quote_sent',
        quoted: true,
      }),
    });
    expect(captured.messageUpdate?.createdAt).toBeInstanceOf(Date);
    expect(captured.messageCreate).toBeNull();
  });

  it('keeps quote voice on the living card when a later pulse omits it', async () => {
    const { service, captured, prisma } = makeService({
      sellerQuoted: true,
      order: {
        id: 'o1',
        status: OrderStatus.Requested,
        buyerCompanyId: 'buyer',
        sellerCompanyId: 'seller',
        items: [openItem('oi1', 10, 100)],
      },
    });
    // Seed prior quote voice on the living message.
    await prisma.message.update({
      where: { id: 'quote-msg' },
      data: {
        type: 'rate',
        metadata: {
          quoted: true,
          noteVoiceUrl: 'https://host/v.webm',
          noteVoiceMediaId: 'media-1',
          noteVoiceDurationMs: 1500,
        },
      },
    });
    // Accept path posts an order_card pulse without voice fields.
    await service.acceptQuote('buyer', 'u1', 'o1');
    expect(captured.messageUpdate).toMatchObject({
      metadata: expect.objectContaining({
        quoted: true,
        noteVoiceUrl: 'https://host/v.webm',
        noteVoiceMediaId: 'media-1',
        noteVoiceDurationMs: 1500,
      }),
    });
  });

  it('firms inquiry intent to order when the seller quotes', async () => {
    const { service, captured } = makeService({
      order: { ...requested, intent: OrderIntent.Inquiry },
    });
    await service.quote('seller', 'u1', 'o1', {
      items: [{ orderItemId: 'oi1', rate: 150, quantity: 20 }],
    });
    expect(captured.updateData).toMatchObject({ intent: OrderIntent.Order });
  });

  it('lets the buyer accept a quote on open rated lines after seller quoted', async () => {
    const { service, captured } = makeService({
      sellerQuoted: true,
      order: {
        ...requested,
        items: [openItem('oi1', 20, 150)],
      },
    });
    await service.acceptQuote('buyer', 'u1', 'o1');
    expect(captured.updateData?.status).toBe(OrderStatus.Confirmed);
  });

  it('rejects accept when catalog rates exist but seller never quoted', async () => {
    const { service } = makeService({
      sellerQuoted: false,
      order: {
        ...requested,
        intent: OrderIntent.Inquiry,
        items: [openItem('oi1', 10, 2450)],
      },
    });
    await expect(service.acceptQuote('buyer', 'u1', 'o1')).rejects.toThrow(/not sent a quote/i);
  });

  it('forbids the buyer from quoting', async () => {
    const { service } = makeService({ order: requested });
    await expect(
      service.quote('buyer', 'u1', 'o1', { items: [{ orderItemId: 'oi1', rate: 10 }] }),
    ).rejects.toThrow();
  });
});

describe('OrderService decideLines', () => {
  it('confirms some lines and declines others, then rolls up to confirmed', async () => {
    const { service, captured } = makeService({
      order: {
        id: 'o1',
        status: OrderStatus.Requested,
        buyerCompanyId: 'buyer',
        sellerCompanyId: 'seller',
        items: [openItem('oi1', 5), openItem('oi2', 5)],
      },
    });
    await service.decideLines('seller', 'u1', 'o1', {
      items: [
        { orderItemId: 'oi1', action: 'confirm' },
        { orderItemId: 'oi2', action: 'decline' },
      ],
    });
    expect(captured.updateData?.status).toBe(OrderStatus.Confirmed);
    expect(captured.messageCreate).toMatchObject({
      type: 'order_card',
      body: 'Seller confirmed 1 · declined 1',
      referenceId: 'o1',
      metadata: expect.objectContaining({
        kind: 'order_lines',
        status: OrderStatus.Confirmed,
        event: 'lines_decided',
        orderLabel: 'Order #O1',
        actorLabel: 'Seller',
      }),
    });
  });

  it('omits declined from the chat body when nothing was declined', async () => {
    const { service, captured } = makeService({
      order: {
        id: 'o1',
        status: OrderStatus.Requested,
        buyerCompanyId: 'buyer',
        sellerCompanyId: 'seller',
        items: [openItem('oi1', 5), openItem('oi2', 5)],
      },
    });
    await service.decideLines('seller', 'u1', 'o1', {
      items: [
        { orderItemId: 'oi1', action: 'confirm' },
        { orderItemId: 'oi2', action: 'confirm', quantity: 3 },
      ],
    });
    expect(captured.messageCreate?.body).toBe('Seller confirmed 2');
    expect(captured.messageCreate?.body).not.toMatch(/declined/i);
  });
});

describe('OrderService lifecycle action cards', () => {
  it('updates the living card when the buyer accepts a quote', async () => {
    const { service, captured } = makeService({
      sellerQuoted: true,
      order: {
        id: 'o1',
        status: OrderStatus.Requested,
        buyerCompanyId: 'buyer',
        sellerCompanyId: 'seller',
        items: [openItem('oi1', 20, 150)],
      },
    });
    await service.acceptQuote('buyer', 'u1', 'o1');
    const posted = captured.messageUpdate ?? captured.messageCreate;
    expect(captured.messageUpdate).toBeTruthy();
    expect(posted).toMatchObject({
      type: 'order_card',
      metadata: expect.objectContaining({ event: 'quote_accepted', quoted: true }),
      body: expect.stringContaining('accepted quote'),
    });
  });

  it('posts a Cancelled card when the buyer cancels', async () => {
    const { service, captured } = makeService({
      order: {
        id: 'ordCancel1',
        status: OrderStatus.Requested,
        buyerCompanyId: 'buyer',
        sellerCompanyId: 'seller',
        items: [openItem('oi1', 2)],
      },
    });
    await service.cancel('buyer', 'u1', 'ordCancel1');
    expect(captured.messageCreate).toMatchObject({
      type: 'order_card',
      metadata: expect.objectContaining({
        event: 'order_cancelled',
        status: OrderStatus.Cancelled,
      }),
      body: expect.stringMatching(/cancelled/i),
    });
  });

  it('posts a Dispatched card on partial dispatch', async () => {
    const { service, captured } = makeService({
      order: {
        id: 'o1',
        status: OrderStatus.Confirmed,
        buyerCompanyId: 'buyer',
        sellerCompanyId: 'seller',
        items: [
          {
            id: 'oi1',
            name: 'A',
            quantity: { toNumber: () => 10 },
            requestedQuantity: { toNumber: () => 10 },
            lineStatus: OrderLineStatus.Confirmed,
            rate: { toNumber: () => 100 },
          },
        ],
        shipments: [],
      },
    });
    await service.dispatch('seller', 'u1', 'o1', {
      items: [{ orderItemId: 'oi1', quantity: 4 }],
      lrNumber: 'LR-1',
    });
    expect(captured.messageCreate).toMatchObject({
      type: 'order_card',
      metadata: expect.objectContaining({
        event: 'order_dispatched',
        partial: true,
      }),
      body: expect.stringContaining('dispatched part'),
    });
  });
});

describe('OrderService state machine', () => {
  const requested = {
    id: 'o1',
    status: OrderStatus.Requested,
    buyerCompanyId: 'buyer',
    sellerCompanyId: 'seller',
    items: [openItem('oi1', 2)],
  };

  it('lets the seller confirm a requested order', async () => {
    const { service, captured } = makeService({ order: requested });
    await service.confirm('seller', 'u1', 'o1');
    expect(captured.updateData?.status).toBe(OrderStatus.Confirmed);
  });

  it('forbids the buyer from confirming', async () => {
    const { service, captured } = makeService({ order: requested });
    await expect(service.confirm('buyer', 'u1', 'o1')).rejects.toThrow();
    expect(captured.updateData).toBeNull();
  });

  it('rejects dispatching an order that is not yet confirmed', async () => {
    const { service } = makeService({ order: requested });
    await expect(service.dispatch('seller', 'u1', 'o1', { lrNumber: 'LR-1' })).rejects.toThrow();
  });

  it('rejects dispatch of open (unconfirmed) lines', async () => {
    const { service } = makeService({
      order: {
        id: 'o1',
        status: OrderStatus.Confirmed,
        buyerCompanyId: 'buyer',
        sellerCompanyId: 'seller',
        items: [openItem('oi1', 5)],
        shipments: [],
      },
    });
    await expect(
      service.dispatch('seller', 'u1', 'o1', {
        lrNumber: 'LR-1',
        items: [{ orderItemId: 'oi1', quantity: 5 }],
      }),
    ).rejects.toThrow();
  });

  it('creates a partial shipment without flipping to dispatched', async () => {
    const { service, captured } = makeService({
      order: {
        id: 'o1',
        status: OrderStatus.Confirmed,
        buyerCompanyId: 'buyer',
        sellerCompanyId: 'seller',
        items: [
          {
            id: 'oi1',
            name: 'A',
            quantity: { toNumber: () => 10 },
            requestedQuantity: { toNumber: () => 10 },
            lineStatus: OrderLineStatus.Confirmed,
            rate: { toNumber: () => 100 },
          },
        ],
        shipments: [],
      },
    });
    await service.dispatch('seller', 'u1', 'o1', {
      items: [{ orderItemId: 'oi1', quantity: 4 }],
      lrNumber: 'LR-1',
    });
    expect(captured.shipmentCreate).toMatchObject({
      lrNumber: 'LR-1',
      items: { create: [{ orderItemId: 'oi1', quantity: 4 }] },
    });
    expect(captured.updateData?.status).not.toBe(OrderStatus.Dispatched);
    expect(captured.updateData?.status).not.toBe(OrderStatus.Settled);
    expect(captured.updateData?.status).toBe(OrderStatus.PartShipped);
  });

  it('full dispatch completes as dispatched', async () => {
    const { service, captured } = makeService({
      order: {
        id: 'o1',
        status: OrderStatus.Confirmed,
        buyerCompanyId: 'buyer',
        sellerCompanyId: 'seller',
        items: [
          {
            id: 'oi1',
            name: 'A',
            quantity: { toNumber: () => 10 },
            requestedQuantity: { toNumber: () => 10 },
            lineStatus: OrderLineStatus.Confirmed,
            rate: { toNumber: () => 100 },
          },
        ],
        shipments: [],
      },
    });
    await service.dispatch('seller', 'u1', 'o1', {
      items: [{ orderItemId: 'oi1', quantity: 10 }],
      lrNumber: 'LR-FULL',
    });
    expect(captured.updateData?.status).toBe(OrderStatus.Dispatched);
    expect(captured.messageCreate).toMatchObject({
      type: 'order_card',
      metadata: expect.objectContaining({
        event: 'order_dispatched',
        status: OrderStatus.Dispatched,
      }),
    });
  });

  it('settles from part_shipped to settled completed status', async () => {
    const { service, captured } = makeService({
      order: {
        id: 'o1',
        status: OrderStatus.PartShipped,
        buyerCompanyId: 'buyer',
        sellerCompanyId: 'seller',
        items: [
          {
            id: 'oi1',
            name: 'A',
            quantity: { toNumber: () => 10 },
            requestedQuantity: { toNumber: () => 10 },
            lineStatus: OrderLineStatus.Confirmed,
            rate: { toNumber: () => 100 },
          },
        ],
        shipments: [
          { items: [{ orderItemId: 'oi1', quantity: { toNumber: () => 4 } }] },
        ],
      },
    });
    await service.settle('seller', 'u1', 'o1');
    expect(captured.updateData?.status).toBe(OrderStatus.Settled);
    expect(captured.messageCreate).toMatchObject({
      metadata: expect.objectContaining({
        event: 'order_settled',
        status: OrderStatus.Settled,
        partial: false,
      }),
      body: expect.stringMatching(/settled/i),
    });
  });

  it('forbids buyer settle and rejects settle with nothing shipped', async () => {
    const part = {
      id: 'o1',
      status: OrderStatus.Confirmed,
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'seller',
      items: [
        {
          id: 'oi1',
          name: 'A',
          quantity: { toNumber: () => 10 },
          requestedQuantity: { toNumber: () => 10 },
          lineStatus: OrderLineStatus.Confirmed,
          rate: { toNumber: () => 100 },
        },
      ],
      shipments: [
        { items: [{ orderItemId: 'oi1', quantity: { toNumber: () => 4 } }] },
      ],
    };
    const { service: sellerSvc } = makeService({ order: part });
    await expect(sellerSvc.settle('buyer', 'u1', 'o1')).rejects.toThrow();

    const { service: noneShipped } = makeService({
      order: { ...part, shipments: [] },
    });
    await expect(noneShipped.settle('seller', 'u1', 'o1')).rejects.toThrow();
  });

  it('404s an order the caller is not a party to', async () => {
    const { service } = makeService({ order: requested });
    await expect(service.confirm('stranger', 'u1', 'o1')).rejects.toThrow();
  });
});
