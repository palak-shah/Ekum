import type { PrismaClient } from '@prisma/client';
import {
  CollectionStatus,
  MessageType,
  OrderStatus,
  OrderTradeMode,
  ProductStatus,
  ThreadParticipantState,
  ThreadType,
  ThreadVisibility,
} from '@ekum/domain-types';
import { seedOwnersAndStaff } from '../conversation/thread-roster';
import type { PrismaService } from '../core/prisma/prisma.service';
import { millShareActive } from './mill-share';
import { laneRoutesDirect } from './trade-lane';

/** Only this trio. Older test shops are left alone. */
export const REPAIR_PARTY_NAMES = {
  buyer: 'Buyer 1',
  trader: 'Trader 1',
  supplier: 'Supplier 1',
} as const;

export function misroutedPackRepairSkip(input: {
  buyerName: string;
  sellerName: string;
  packOwnerName: string | null;
  tradeMode: string;
  status: string;
  touched: boolean;
  sellerIsMill: boolean;
  allLinesInPack: boolean;
  direct: boolean;
  hasUpstream: boolean;
}): string | null {
  const buyer = input.buyerName.trim();
  const seller = input.sellerName.trim();
  const owner = input.packOwnerName?.trim() ?? '';
  if (
    buyer !== REPAIR_PARTY_NAMES.buyer ||
    seller !== REPAIR_PARTY_NAMES.supplier ||
    owner !== REPAIR_PARTY_NAMES.trader
  ) {
    return 'other-shops';
  }
  if (input.tradeMode !== OrderTradeMode.Bilateral) return 'not-bilateral';
  if (input.status !== OrderStatus.Requested || input.touched) return 'already-moved';
  if (!input.sellerIsMill) return 'seller-not-mill';
  if (!input.allLinesInPack) return 'not-one-trader-pack';
  if (input.direct) return 'direct-link';
  if (input.hasUpstream) return 'already-has-hop';
  return null;
}

async function ensureBuyerTraderThread(
  prisma: PrismaClient,
  buyerId: string,
  traderId: string,
): Promise<string> {
  const existing = await prisma.thread.findFirst({
    where: {
      type: ThreadType.Direct,
      visibility: ThreadVisibility.Shared,
      AND: [
        { participants: { some: { companyId: buyerId } } },
        { participants: { some: { companyId: traderId } } },
      ],
    },
    select: { id: true },
  });
  const threadId =
    existing?.id ??
    (
      await prisma.thread.create({
        data: {
          type: ThreadType.Direct,
          visibility: ThreadVisibility.Shared,
          createdByCompanyId: buyerId,
          participants: {
            create: [
              { companyId: buyerId, state: ThreadParticipantState.Active },
              { companyId: traderId, state: ThreadParticipantState.Active },
            ],
          },
        },
        select: { id: true },
      })
    ).id;
  const db = prisma as unknown as PrismaService;
  await seedOwnersAndStaff(db, threadId, buyerId, []);
  await seedOwnersAndStaff(db, threadId, traderId, []);
  return threadId;
}

export async function repairMisroutedPackOrders(prisma: PrismaClient): Promise<{
  repaired: string[];
  skipped: Array<{ id: string; reason: string }>;
}> {
  const repaired: string[] = [];
  const skipped: Array<{ id: string; reason: string }> = [];
  const orders = await prisma.order.findMany({
    where: {
      tradeMode: OrderTradeMode.Bilateral,
      status: OrderStatus.Requested,
      downstreamOrderId: null,
      buyer: { name: REPAIR_PARTY_NAMES.buyer },
      seller: { name: REPAIR_PARTY_NAMES.supplier },
    },
    include: {
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      items: true,
      upstreams: { select: { id: true } },
      shipments: { select: { id: true } },
    },
  });

  for (const order of orders) {
    const productIds = [
      ...new Set(order.items.map((item) => item.productId).filter((id): id is string => Boolean(id))),
    ];
    const products =
      productIds.length === 0
        ? []
        : await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, companyId: true },
          });
    const sellerIsMill =
      products.length === productIds.length &&
      products.every((product) => product.companyId === order.sellerCompanyId);

    const packs = await prisma.collection.findMany({
      where: {
        status: CollectionStatus.Published,
        company: { name: REPAIR_PARTY_NAMES.trader },
        products: { some: { productId: { in: productIds } } },
      },
      select: {
        id: true,
        company: { select: { id: true, name: true } },
        products: {
          where: { productId: { in: productIds } },
          select: {
            productId: true,
            product: { select: { status: true } },
          },
        },
      },
    });
    const covered = new Set<string>();
    const ownerIds = new Set<string>();
    let packOwnerName: string | null = null;
    for (const row of packs) {
      ownerIds.add(row.company.id);
      packOwnerName = row.company.name;
      for (const member of row.products) {
        if (member.product.status === ProductStatus.Published) covered.add(member.productId);
      }
    }
    const pack =
      ownerIds.size === 1 && productIds.every((id) => covered.has(id))
        ? { company: { id: [...ownerIds][0]!, name: packOwnerName ?? '' } }
        : undefined;

    const lane = pack
      ? await prisma.tradeLane.findUnique({
          where: {
            traderCompanyId_sellerCompanyId_buyerCompanyId: {
              traderCompanyId: pack.company.id,
              sellerCompanyId: order.sellerCompanyId,
              buyerCompanyId: order.buyerCompanyId,
            },
          },
        })
      : null;
    const shareActive = pack
      ? await millShareActive(prisma, pack.company.id, order.sellerCompanyId)
      : false;
    const direct = laneRoutesDirect({
      ticket: lane?.ticket,
      behaviors: lane?.behaviors,
      millShareActive: shareActive,
    });

    const reason = misroutedPackRepairSkip({
      buyerName: order.buyer.name,
      sellerName: order.seller.name,
      packOwnerName: pack?.company.name ?? null,
      tradeMode: order.tradeMode,
      status: order.status,
      touched: Boolean(
        order.confirmedAt || order.quotedAt || order.dispatchedAt || order.settledAt || order.shipments.length,
      ),
      sellerIsMill,
      allLinesInPack: Boolean(pack),
      direct,
      hasUpstream: order.upstreams.length > 0,
    });
    if (reason || !pack) {
      skipped.push({ id: order.id, reason: reason ?? 'not-one-trader-pack' });
      continue;
    }

    const traderId = pack.company.id;
    const threadId = await ensureBuyerTraderThread(prisma, order.buyerCompanyId, traderId);

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          sellerCompanyId: traderId,
          tradeMode: OrderTradeMode.Manage,
        },
      });
      await tx.tradeLane.upsert({
        where: {
          traderCompanyId_sellerCompanyId_buyerCompanyId: {
            traderCompanyId: traderId,
            sellerCompanyId: order.sellerCompanyId,
            buyerCompanyId: order.buyerCompanyId,
          },
        },
        create: {
          traderCompanyId: traderId,
          sellerCompanyId: order.sellerCompanyId,
          buyerCompanyId: order.buyerCompanyId,
          ticket: 'me',
          reveal: false,
          behaviors: { directOrder: true, autoRepost: false },
        },
        update: {},
      });
      await tx.order.create({
        data: {
          kind: order.kind,
          intent: order.intent,
          status: OrderStatus.Requested,
          tradeMode: OrderTradeMode.Bilateral,
          buyerCompanyId: traderId,
          sellerCompanyId: order.sellerCompanyId,
          createdByCompanyId: traderId,
          createdByUserId: order.createdByUserId,
          downstreamOrderId: order.id,
          upstreamReleasedAt: null,
          items: {
            create: order.items.map((item) => ({
              productId: item.productId,
              name: item.name,
              sku: item.sku,
              rate: item.rate ?? undefined,
              unit: item.unit,
              dispatchUnit: item.dispatchUnit,
              catalogRateUnit: item.catalogRateUnit,
              piecesPerPack: item.piecesPerPack,
              image: item.image,
              images: item.images,
              quantity: item.quantity,
              requestedQuantity: item.requestedQuantity,
              sourceItemId: item.id,
              lineStatus: item.lineStatus,
              note: item.note,
            })),
          },
        },
      });
      await tx.message.updateMany({
        where: {
          referenceId: order.id,
          type: { in: [MessageType.OrderCard, MessageType.Rate] },
        },
        data: { threadId },
      });
      await tx.thread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date() },
      });
    });
    repaired.push(order.id);
  }

  return { repaired, skipped };
}
