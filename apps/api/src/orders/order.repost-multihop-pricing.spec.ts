import { describe, expect, it, vi } from 'vitest';
import {
  OrderLineStatus,
  OrderStatus,
  OrderTradeMode,
  ProductStatus,
  RateVisibility,
  RepostPricingMode,
  resolveRepostDesignPricing,
} from '@ekum/domain-types';
import { OrderService } from './order.service';

/**
 * Batch 3.2 — Mill → Trader A → Trader B → Buyer order journey.
 * Multi-hop pricing + parent stamp + passMill keep buyer-facing ≠ mill rate.
 */
describe('Mill→A→B→Buyer order pricing journey (Batch 3.2)', () => {
  function decimal(n: number | null) {
    if (n == null) return null;
    return { toNumber: () => n };
  }

  it('parent stamps B buyer-facing; mill hop keeps mill rate; passMill does not clobber', async () => {
    const millRate = 100;
    // A: +10% → 110. B: Same as A → 110.
    const aFacing = resolveRepostDesignPricing({
      config: {
        mode: RepostPricingMode.MarginPercent,
        marginValue: 10,
        editedRate: null,
        editOwnBase: null,
      },
      sourceRate: millRate,
      sourceDisclosed: true,
    }).buyerFacing;
    expect(aFacing).toBe(110);
    const bFacing = resolveRepostDesignPricing({
      config: {
        mode: RepostPricingMode.Same,
        marginValue: null,
        editedRate: null,
        editOwnBase: null,
      },
      sourceRate: aFacing,
      sourceDisclosed: true,
    }).buyerFacing;
    expect(bFacing).toBe(110);

    // --- Place parent on B's pack (catalogWholePack) ---
    const prismaPlace = {
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'sku-1',
            companyId: 'mill',
            name: 'Cotton',
            sku: 'C1',
            status: ProductStatus.Published,
            rate: decimal(millRate),
            images: [],
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
              repostPricingMode: RepostPricingMode.Same,
              repostMarginValue: null,
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
              repostSourceCollectionId: 'pack-mill',
              repostPricingMode: RepostPricingMode.MarginPercent,
              repostMarginValue: decimal(10),
              repostEditedRate: null,
              repostEditOwnBase: null,
              products: [
                {
                  productId: 'sku-1',
                  pricingMode: null,
                  marginValue: null,
                  editedRate: null,
                  editOwnBase: null,
                  product: { id: 'sku-1', rate: decimal(millRate) },
                },
              ],
            };
          }
          if (where.id === 'pack-mill') {
            return {
              id: 'pack-mill',
              companyId: 'mill',
              rate: null,
              rateVisibility: RateVisibility.Visible,
              repostSourceCollectionId: null,
              repostPricingMode: null,
              products: [
                {
                  productId: 'sku-1',
                  pricingMode: null,
                  marginValue: null,
                  editedRate: null,
                  editOwnBase: null,
                  product: { id: 'sku-1', rate: decimal(millRate) },
                },
              ],
            };
          }
          return null;
        }),
      },
      collectionProduct: {
        findMany: vi.fn(async () => [
          {
            productId: 'sku-1',
            pricingMode: null,
            marginValue: null,
            editedRate: null,
            editOwnBase: null,
            product: { id: 'sku-1', rate: decimal(millRate), companyId: 'mill' },
          },
        ]),
      },
    };

    const placeSvc = Object.create(OrderService.prototype) as OrderService;
    Object.assign(placeSvc, { prisma: prismaPlace });
    const parentLines = await (
      placeSvc as unknown as {
        snapshotItems: (
          dto: unknown,
          opts?: unknown,
        ) => Promise<Array<{ rate: unknown }>>;
      }
    ).snapshotItems(
      {
        kind: 'standard',
        intent: 'order',
        sellerCompanyId: 'trader-b',
        items: [{ productId: 'sku-1', quantity: 5, images: [] }],
      },
      {
        allowForeignProducts: true,
        catalogWholePack: { id: 'pack-b', name: 'B Pack' },
      },
    );
    expect(parentLines[0]!.rate).toBe(110);

    // --- Mill hop snapshot (no pack hint) ---
    const hopLines = await (
      placeSvc as unknown as {
        snapshotItems: (
          dto: unknown,
          opts?: unknown,
        ) => Promise<Array<{ rate: unknown }>>;
      }
    ).snapshotItems(
      {
        kind: 'standard',
        intent: 'order',
        sellerCompanyId: 'mill',
        items: [{ productId: 'sku-1', quantity: 5, images: [] }],
      },
      { allowForeignProducts: false },
    );
    const hopRate = hopLines[0]!.rate as { toNumber: () => number };
    expect(hopRate.toNumber()).toBe(millRate);
    expect(parentLines[0]!.rate).toBe(110);
    expect(hopRate.toNumber()).not.toBe(110);

    // --- passMill: must not overwrite parent 110 with mill 100 ---
    const orderItemUpdate = vi.fn(async () => ({}));
    const passPrisma = {
      order: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({
            id: 'hop-1',
            downstreamOrderId: 'parent-1',
            upstreamReleasedAt: new Date(),
            passHeldAt: null,
            status: OrderStatus.Confirmed,
            sellerCompanyId: 'mill',
            seller: { name: 'Mill' },
            items: [
              {
                id: 'h-1',
                productId: 'sku-1',
                sourceItemId: 'p-1',
                name: 'Cotton',
                quantity: { toNumber: () => 5 },
                rate: { toNumber: () => millRate },
                confirmedQuantity: { toNumber: () => 5 },
                confirmedRate: { toNumber: () => millRate },
                lineStatus: OrderLineStatus.Confirmed,
              },
            ],
          })
          .mockResolvedValueOnce({
            id: 'parent-1',
            tradeMode: OrderTradeMode.Manage,
            status: OrderStatus.Confirmed,
            buyerCompanyId: 'buyer',
            sellerCompanyId: 'trader-b',
            seller: { name: 'B' },
            items: [
              {
                id: 'p-1',
                productId: 'sku-1',
                name: 'Cotton',
                quantity: { toNumber: () => 5 },
                rate: { toNumber: () => 110 },
                confirmedQuantity: { toNumber: () => 5 },
                confirmedRate: null,
                lineStatus: OrderLineStatus.Open,
              },
            ],
          })
          .mockResolvedValueOnce({
            id: 'parent-1',
            tradeMode: OrderTradeMode.Manage,
            status: OrderStatus.Confirmed,
            buyerCompanyId: 'buyer',
            sellerCompanyId: 'trader-b',
            seller: { name: 'B' },
            items: [
              {
                id: 'p-1',
                productId: 'sku-1',
                quantity: { toNumber: () => 5 },
                rate: { toNumber: () => 110 },
                lineStatus: OrderLineStatus.Confirmed,
              },
            ],
          }),
        update: vi.fn(async () => ({})),
      },
      orderItem: { update: orderItemUpdate },
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({ orderItem: { update: orderItemUpdate } }),
      ),
    };

    const passSvc = Object.create(OrderService.prototype) as OrderService;
    Object.assign(passSvc, {
      prisma: passPrisma,
      trail: { append: vi.fn(async () => undefined) },
      postOrderCard: vi.fn(async () => undefined),
      orderAudit: { appendQty: vi.fn(async () => undefined) },
      auditItem: () => ({}),
    });

    await (
      passSvc as unknown as {
        passMillLinesToParent: (
          id: string,
          actor: string,
          userId: string,
        ) => Promise<void>;
      }
    ).passMillLinesToParent('hop-1', 'mill', 'u1');

    const data = orderItemUpdate.mock.calls[0]![0].data as Record<string, unknown>;
    expect(data.rate).toBeUndefined();
    expect(data.confirmedRate).toEqual({ toNumber: expect.any(Function) });
  });
});
