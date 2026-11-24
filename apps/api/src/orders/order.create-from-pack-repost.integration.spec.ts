/**
 * Database-backed supplier → trader → buyer from-pack pricing journey.
 * Requires DATABASE_URL (local docker postgres). Skips when DB unreachable.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  OrderIntent,
  OrderKind,
  ProductStatus,
  RateVisibility,
  RepostPricingMode,
} from '@ekum/domain-types';
import { OrderService } from './order.service';
import { OrderSerializer } from './order.serializer';

const prisma = new PrismaClient();
const TAG = `repost-pricing-int-${Date.now()}`;

async function dbReady(): Promise<boolean> {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

function buildService(db: PrismaClient): OrderService {
  const serializer = {
    toOrderView: (
      order: { id: string; items: Array<{ id: string; productId: string | null; rate: unknown; name?: string }> },
    ) => ({
      id: order.id,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.name ?? 'line',
        rate:
          item.rate != null && typeof item.rate === 'object' && 'toNumber' in item.rate
            ? (item.rate as { toNumber: () => number }).toNumber()
            : item.rate,
      })),
    }),
  } as unknown as OrderSerializer;

  const service = Object.create(OrderService.prototype) as OrderService;
  Object.assign(service, {
    prisma: db,
    serializer,
    tradeAccess: { assertCanTrade: vi.fn(async () => undefined) },
    events: {
      orderCreated: vi.fn(),
      orderUpdated: vi.fn(),
    },
    config: { get: vi.fn(() => undefined) },
    jobs: { enqueue: vi.fn(async () => undefined) },
    threads: {
      ensureTradeThread: vi.fn(async () => 'thread-int-1'),
      findDirectThreadId: vi.fn(async () => null),
      ensureTradeLaneGroup: vi.fn(async () => 'group-int-1'),
      notifyUserIdsForMessage: vi.fn(async () => ({ companyIds: [], userIds: [] })),
    },
    trail: {
      append: vi.fn(async () => undefined),
      recordPlaced: vi.fn(async () => undefined),
    },
    orderAudit: {
      write: vi.fn(async () => undefined),
    },
    writeQtyAudit: vi.fn(async () => undefined),
    upsertOrderThreadMessage: vi.fn(async () => 'msg-1'),
    noteVoiceCreateFields: vi.fn(async () => ({})),
    resolveFacilitatorOptions: vi.fn(async (_a, _s, _f, options: Record<string, unknown>) => ({
      tradeMode: options.tradeMode,
      facilitatorCompanyId: options.facilitatorCompanyId ?? null,
      downstreamOrderId: options.downstreamOrderId ?? null,
      holdUntilSend: options.holdUntilSend,
      createdByCompanyId: options.createdByCompanyId,
    })),
    upsertTradeLane: vi.fn(async () => undefined),
  });
  return service;
}

describe('createFromPack repost Edit pricing (Prisma integration)', () => {
  const ready = { ok: false };
  let millCompanyId = '';
  let traderCompanyId = '';
  let buyerCompanyId = '';
  let millUserId = '';
  let traderUserId = '';
  let buyerUserId = '';
  let productId = '';
  let millPackId = '';
  let millPackBId = '';
  let traderPackId = '';
  let traderPackBId = '';

  beforeAll(async () => {
    ready.ok = await dbReady();
    if (!ready.ok) return;

    const millUser = await prisma.user.create({
      data: { phone: `+9199${String(Date.now()).slice(-8)}1`, name: `${TAG}-mill` },
    });
    const traderUser = await prisma.user.create({
      data: { phone: `+9199${String(Date.now()).slice(-8)}2`, name: `${TAG}-trader` },
    });
    const buyerUser = await prisma.user.create({
      data: { phone: `+9199${String(Date.now()).slice(-8)}3`, name: `${TAG}-buyer` },
    });
    millUserId = millUser.id;
    traderUserId = traderUser.id;
    buyerUserId = buyerUser.id;

    const mill = await prisma.company.create({
      data: {
        name: `${TAG} Mill`,
        city: 'Surat',
        memberships: { create: { userId: millUserId, role: 'owner' } },
        settings: { create: { tradeDefaults: { trading: true } } },
      },
    });
    const trader = await prisma.company.create({
      data: {
        name: `${TAG} Trader`,
        city: 'Surat',
        memberships: { create: { userId: traderUserId, role: 'owner' } },
        settings: { create: { tradeDefaults: { trading: true } } },
      },
    });
    const buyer = await prisma.company.create({
      data: {
        name: `${TAG} Buyer`,
        city: 'Surat',
        memberships: { create: { userId: buyerUserId, role: 'owner' } },
        settings: { create: { tradeDefaults: { trading: true } } },
      },
    });
    millCompanyId = mill.id;
    traderCompanyId = trader.id;
    buyerCompanyId = buyer.id;

    await prisma.follow.create({
      data: {
        followerCompanyId: buyerCompanyId,
        followedCompanyId: traderCompanyId,
        status: 'allowed',
      },
    });
    await prisma.follow.create({
      data: {
        followerCompanyId: traderCompanyId,
        followedCompanyId: millCompanyId,
        status: 'allowed',
        accessKind: 'pack',
      },
    });

    const product = await prisma.product.create({
      data: {
        companyId: millCompanyId,
        name: `${TAG} Silk`,
        status: ProductStatus.Published,
        rate: new Prisma.Decimal(100),
        rateVisibility: RateVisibility.Visible,
        audience: 'followers',
        allowForward: true,
        postedToMarketAt: new Date(),
        images: [],
        createdByUserId: millUserId,
        updatedByUserId: millUserId,
      },
    });
    productId = product.id;

    const millPack = await prisma.collection.create({
      data: {
        companyId: millCompanyId,
        name: `${TAG} Mill Pack`,
        status: 'published',
        audience: 'followers',
        rateVisibility: RateVisibility.Visible,
        allowForward: true,
        exploreActivityAt: new Date(),
        createdByUserId: millUserId,
        updatedByUserId: millUserId,
        products: {
          create: [{ productId, excluded: false, membershipOrigin: 'local' }],
        },
      },
    });
    millPackId = millPack.id;

    const millPackB = await prisma.collection.create({
      data: {
        companyId: millCompanyId,
        name: `${TAG} Mill Pack B`,
        status: 'published',
        audience: 'followers',
        rateVisibility: RateVisibility.Visible,
        allowForward: true,
        exploreActivityAt: new Date(),
        createdByUserId: millUserId,
        updatedByUserId: millUserId,
        products: {
          create: [{ productId, excluded: false, membershipOrigin: 'local' }],
        },
      },
    });
    millPackBId = millPackB.id;

    const traderPack = await prisma.collection.create({
      data: {
        companyId: traderCompanyId,
        name: `${TAG} Trader Repost`,
        status: 'published',
        audience: 'followers',
        rateVisibility: RateVisibility.Visible,
        allowForward: true,
        exploreActivityAt: new Date(),
        repostSourceCollectionId: millPackId,
        repostRootCollectionId: millPackId,
        repostPricingMode: RepostPricingMode.Edit,
        repostEditedRate: new Prisma.Decimal(125),
        repostEditOwnBase: null,
        createdByUserId: traderUserId,
        updatedByUserId: traderUserId,
        products: {
          create: [{ productId, excluded: false, membershipOrigin: 'synced' }],
        },
      },
    });
    traderPackId = traderPack.id;

    const traderPackB = await prisma.collection.create({
      data: {
        companyId: traderCompanyId,
        name: `${TAG} Trader Repost B`,
        status: 'published',
        audience: 'followers',
        rateVisibility: RateVisibility.Visible,
        allowForward: true,
        exploreActivityAt: new Date(),
        repostSourceCollectionId: millPackBId,
        repostRootCollectionId: millPackBId,
        repostPricingMode: RepostPricingMode.MarginFixed,
        repostMarginValue: new Prisma.Decimal(50),
        createdByUserId: traderUserId,
        updatedByUserId: traderUserId,
        products: {
          create: [{ productId, excluded: false, membershipOrigin: 'synced' }],
        },
      },
    });
    traderPackBId = traderPackB.id;
  }, 60_000);

  afterAll(async () => {
    if (!ready.ok) {
      await prisma.$disconnect();
      return;
    }
    try {
      await prisma.orderItem.deleteMany({
        where: {
          order: {
            OR: [
              { buyerCompanyId: { in: [buyerCompanyId, traderCompanyId] } },
              { sellerCompanyId: { in: [millCompanyId, traderCompanyId] } },
            ],
          },
        },
      });
      await prisma.order.deleteMany({
        where: {
          OR: [
            { buyerCompanyId: { in: [buyerCompanyId, traderCompanyId] } },
            { sellerCompanyId: { in: [millCompanyId, traderCompanyId] } },
          ],
        },
      });
      await prisma.collectionProduct.deleteMany({
        where: {
          collectionId: {
            in: [millPackId, millPackBId, traderPackId, traderPackBId].filter(Boolean),
          },
        },
      });
      await prisma.collection.deleteMany({
        where: {
          id: { in: [millPackId, millPackBId, traderPackId, traderPackBId].filter(Boolean) },
        },
      });
      if (productId) await prisma.product.deleteMany({ where: { id: productId } });
      await prisma.follow.deleteMany({
        where: {
          OR: [
            { followerCompanyId: { in: [buyerCompanyId, traderCompanyId] } },
            { followedCompanyId: { in: [millCompanyId, traderCompanyId] } },
          ],
        },
      });
      await prisma.companySettings.deleteMany({
        where: { companyId: { in: [millCompanyId, traderCompanyId, buyerCompanyId] } },
      });
      await prisma.companyMembership.deleteMany({
        where: { companyId: { in: [millCompanyId, traderCompanyId, buyerCompanyId] } },
      });
      await prisma.company.deleteMany({
        where: { id: { in: [millCompanyId, traderCompanyId, buyerCompanyId] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [millUserId, traderUserId, buyerUserId] } },
      });
    } finally {
      await prisma.$disconnect();
    }
  }, 60_000);

  it('stamps ₹125 on buyer OrderItem; Product.rate stays ₹100; later pack Edit does not rewrite; next order is ₹130', async () => {
    if (!ready.ok) {
      // eslint-disable-next-line no-console
      console.warn('Skipping Prisma integration — DATABASE_URL unreachable');
      return;
    }

    const service = buildService(prisma);
    const first = await service.createFromPack(buyerCompanyId, buyerUserId, {
      collectionId: traderPackId,
      kind: OrderKind.Standard,
      intent: OrderIntent.Order,
      items: [{ productId, quantity: 10 }],
    });

    expect(first.downstream).toBeTruthy();
    const firstParent = first.downstream!;
    const firstLine = firstParent.items.find((item) => item.productId === productId);
    expect(firstLine).toBeTruthy();
    const firstRate =
      typeof firstLine!.rate === 'number'
        ? firstLine!.rate
        : Number(firstLine!.rate);
    expect(firstRate).toBe(125);

    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(Number(product.rate)).toBe(100);

    const storedFirst = await prisma.orderItem.findFirstOrThrow({
      where: { orderId: firstParent.id, productId },
    });
    expect(Number(storedFirst.rate)).toBe(125);

    await prisma.collection.update({
      where: { id: traderPackId },
      data: { repostEditedRate: new Prisma.Decimal(130) },
    });

    const afterChange = await prisma.orderItem.findFirstOrThrow({
      where: { id: storedFirst.id },
    });
    expect(Number(afterChange.rate)).toBe(125);

    const second = await service.createFromPack(buyerCompanyId, buyerUserId, {
      collectionId: traderPackId,
      kind: OrderKind.Standard,
      intent: OrderIntent.Order,
      items: [{ productId, quantity: 5 }],
    });
    const secondLine = second.downstream!.items.find((item) => item.productId === productId);
    const secondRate =
      typeof secondLine!.rate === 'number'
        ? secondLine!.rate
        : Number(secondLine!.rate);
    expect(secondRate).toBe(130);

    const productStill = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(Number(productStill.rate)).toBe(100);
  }, 90_000);

  it('two packs same product different margin stamp different Place ₹; edit A leaves both OrderItems', async () => {
    if (!ready.ok) {
      // eslint-disable-next-line no-console
      console.warn('Skipping Prisma integration — DATABASE_URL unreachable');
      return;
    }

    await prisma.collection.update({
      where: { id: traderPackId },
      data: { repostEditedRate: new Prisma.Decimal(125) },
    });

    const service = buildService(prisma);
    const fromA = await service.createFromPack(buyerCompanyId, buyerUserId, {
      collectionId: traderPackId,
      kind: OrderKind.Standard,
      intent: OrderIntent.Order,
      items: [{ productId, quantity: 3 }],
    });
    const fromB = await service.createFromPack(buyerCompanyId, buyerUserId, {
      collectionId: traderPackBId,
      kind: OrderKind.Standard,
      intent: OrderIntent.Order,
      items: [{ productId, quantity: 3 }],
    });

    const lineA = fromA.downstream!.items.find((item) => item.productId === productId)!;
    const lineB = fromB.downstream!.items.find((item) => item.productId === productId)!;
    const rateA = typeof lineA.rate === 'number' ? lineA.rate : Number(lineA.rate);
    const rateB = typeof lineB.rate === 'number' ? lineB.rate : Number(lineB.rate);
    expect(rateA).toBe(125);
    // Pack B margin_fixed +50 on mill ₹100 → ₹150
    expect(rateB).toBe(150);

    const storedA = await prisma.orderItem.findFirstOrThrow({
      where: { orderId: fromA.downstream!.id, productId },
    });
    const storedB = await prisma.orderItem.findFirstOrThrow({
      where: { orderId: fromB.downstream!.id, productId },
    });
    const stampedA = Number(storedA.rate);
    const stampedB = Number(storedB.rate);

    await prisma.collection.update({
      where: { id: traderPackId },
      data: { repostEditedRate: new Prisma.Decimal(199) },
    });

    expect(Number((await prisma.orderItem.findFirstOrThrow({ where: { id: storedA.id } })).rate)).toBe(
      stampedA,
    );
    expect(Number((await prisma.orderItem.findFirstOrThrow({ where: { id: storedB.id } })).rate)).toBe(
      stampedB,
    );
  }, 90_000);
});
