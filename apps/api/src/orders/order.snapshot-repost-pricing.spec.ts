import { describe, expect, it, vi } from 'vitest';
import {
  OrderIntent,
  OrderKind,
  ProductStatus,
  RateVisibility,
  RepostPricingMode,
} from '@ekum/domain-types';
import { OrderService } from './order.service';

/**
 * Batch 3.2 — snapshotItems stamps resolved buyer-facing for calc packs;
 * hop path (no catalogWholePack) keeps supplier Product.rate.
 */
describe('snapshotItems repost pricing (Batch 3.2)', () => {
  function decimal(n: number | null) {
    if (n == null) return null;
    return { toNumber: () => n };
  }

  function buildService(prisma: unknown) {
    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, { prisma });
    return service as unknown as {
      snapshotItems: (
        dto: {
          kind: string;
          intent?: string;
          sellerCompanyId: string;
          items: Array<{ productId: string; quantity: number; images?: string[] }>;
        },
        opts?: {
          allowForeignProducts?: boolean;
          catalogWholePack?: { id: string; name: string } | null;
        },
      ) => Promise<Array<{ productId: string; rate: unknown }>>;
    };
  }

  it('calc-mode from-pack parent stamps resolved buyer-facing, not mill Product.rate', async () => {
    const prisma = {
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'sku-1',
            companyId: 'mill',
            name: 'Cotton',
            sku: 'C1',
            status: ProductStatus.Published,
            rate: decimal(100),
            images: ['https://img/1.jpg'],
            unit: 'pc',
            dispatchUnit: null,
            catalogRateUnit: null,
            piecesPerPack: null,
            catalogCollectionId: null,
          },
        ]),
      },
      collection: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === 'pack-b') {
            return {
              id: 'pack-b',
              companyId: 'trader-b',
              rate: null,
              rateVisibility: RateVisibility.Visible,
              repostSourceCollectionId: 'pack-a',
              repostPricingMode: RepostPricingMode.MarginFixed,
              repostMarginValue: decimal(20),
              repostEditedRate: null,
              repostEditOwnBase: null,
            };
          }
          if (where.id === 'pack-a') {
            return {
              id: 'pack-a',
              companyId: 'trader-a',
              rate: null,
              rateVisibility: RateVisibility.Visible,
              repostSourceCollectionId: null,
              repostPricingMode: null,
              repostMarginValue: null,
              repostEditedRate: null,
              repostEditOwnBase: null,
              products: [
                {
                  productId: 'sku-1',
                  pricingMode: null,
                  marginValue: null,
                  editedRate: null,
                  editOwnBase: null,
                  product: { id: 'sku-1', rate: decimal(100) },
                },
              ],
            };
          }
          return null;
        }),
      },
      collectionProduct: {
        findMany: vi.fn(async ({ where }: { where: { collectionId: string } }) => {
          if (where.collectionId === 'pack-b') {
            return [
              {
                productId: 'sku-1',
                pricingMode: null,
                marginValue: null,
                editedRate: null,
                editOwnBase: null,
                product: { id: 'sku-1', rate: decimal(100), companyId: 'mill' },
              },
            ];
          }
          return [];
        }),
      },
    };

    const service = buildService(prisma);
    const rows = await service.snapshotItems(
      {
        kind: OrderKind.Standard,
        intent: OrderIntent.Order,
        sellerCompanyId: 'trader-b',
        items: [{ productId: 'sku-1', quantity: 10, images: [] }],
      },
      {
        allowForeignProducts: true,
        catalogWholePack: { id: 'pack-b', name: 'B Pack' },
      },
    );

    expect(rows).toHaveLength(1);
    // Mill product is ₹100; B margin +20 → buyer-facing ₹120.
    expect(rows[0]!.rate).toBe(120);
  });

  it('mill hop without catalogWholePack keeps supplier Product.rate', async () => {
    const prisma = {
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'sku-1',
            companyId: 'mill',
            name: 'Cotton',
            sku: 'C1',
            status: ProductStatus.Published,
            rate: decimal(100),
            images: [],
            unit: 'pc',
            dispatchUnit: null,
            catalogRateUnit: null,
            piecesPerPack: null,
            catalogCollectionId: null,
          },
        ]),
      },
      collection: { findUnique: vi.fn(async () => null) },
      collectionProduct: { findMany: vi.fn(async () => []) },
    };

    const service = buildService(prisma);
    const rows = await service.snapshotItems(
      {
        kind: OrderKind.Standard,
        intent: OrderIntent.Order,
        sellerCompanyId: 'mill',
        items: [{ productId: 'sku-1', quantity: 10, images: [] }],
      },
      { allowForeignProducts: false },
    );

    const rate = rows[0]!.rate as { toNumber: () => number };
    expect(rate.toNumber()).toBe(100);
  });

  it('changing pack margin after place does not rewrite an existing OrderItem snapshot', async () => {
    // Place stamps 120 once; later config change is a new resolve only — no OrderItem.update.
    const orderItemUpdate = vi.fn(async () => ({}));
    const placedParentRate = 120;
    const millRate = 100;

    const prisma = {
      order: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({
            id: 'hop-1',
            downstreamOrderId: 'parent-1',
            upstreamReleasedAt: new Date(),
            passHeldAt: null,
            status: 'confirmed',
            sellerCompanyId: 'mill',
            seller: { name: 'Mill' },
            items: [
              {
                id: 'h-1',
                productId: 'sku-1',
                sourceItemId: 'p-1',
                name: 'Cotton',
                quantity: { toNumber: () => 10 },
                rate: { toNumber: () => millRate },
                confirmedQuantity: { toNumber: () => 10 },
                confirmedRate: { toNumber: () => millRate },
                lineStatus: 'confirmed',
              },
            ],
          })
          .mockResolvedValueOnce({
            id: 'parent-1',
            tradeMode: 'manage',
            status: 'confirmed',
            buyerCompanyId: 'buyer',
            sellerCompanyId: 'trader-b',
            seller: { name: 'B' },
            items: [
              {
                id: 'p-1',
                productId: 'sku-1',
                name: 'Cotton',
                quantity: { toNumber: () => 10 },
                rate: { toNumber: () => placedParentRate },
                confirmedQuantity: { toNumber: () => 10 },
                confirmedRate: null,
                lineStatus: 'open',
              },
            ],
          })
          .mockResolvedValueOnce({
            id: 'parent-1',
            tradeMode: 'manage',
            status: 'confirmed',
            buyerCompanyId: 'buyer',
            sellerCompanyId: 'trader-b',
            seller: { name: 'B' },
            items: [
              {
                id: 'p-1',
                productId: 'sku-1',
                quantity: { toNumber: () => 10 },
                rate: { toNumber: () => placedParentRate },
                lineStatus: 'confirmed',
              },
            ],
          }),
        update: vi.fn(async () => ({})),
      },
      orderItem: { update: orderItemUpdate },
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({ orderItem: { update: orderItemUpdate } }),
      ),
      // Pack config now would resolve to 150 — must not affect placed lines.
      collection: {
        findUnique: vi.fn(async () => ({
          id: 'pack-b',
          repostPricingMode: RepostPricingMode.MarginFixed,
          repostMarginValue: decimal(50),
        })),
      },
    };

    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, {
      prisma,
      trail: { append: vi.fn(async () => undefined) },
      postOrderCard: vi.fn(async () => undefined),
      orderAudit: { appendQty: vi.fn(async () => undefined) },
      auditItem: () => ({}),
    });

    await (
      service as unknown as {
        passMillLinesToParent: (
          id: string,
          actor: string,
          userId: string,
        ) => Promise<void>;
      }
    ).passMillLinesToParent('hop-1', 'mill', 'u1');

    const data = orderItemUpdate.mock.calls[0]![0].data as Record<string, unknown>;
    expect(data.rate).toBeUndefined();
    expect(prisma.collection.findUnique).not.toHaveBeenCalled();
  });
});
