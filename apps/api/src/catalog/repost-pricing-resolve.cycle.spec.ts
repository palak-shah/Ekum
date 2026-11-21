import { describe, expect, it, vi } from 'vitest';
import { RateVisibility, RepostPricingMode } from '@ekum/domain-types';
import { resolvePackMemberBuyerRates } from './repost-pricing-resolve';

describe('resolvePackMemberBuyerRates cycle fail-closed (Batch 3 audit)', () => {
  it('does not recurse forever when A → B → A; buyer-facing stays null', async () => {
    const packA = {
      id: 'pack-a',
      companyId: 'co-a',
      rate: null,
      rateVisibility: RateVisibility.Visible,
      repostSourceCollectionId: 'pack-b',
      repostPricingMode: RepostPricingMode.Same,
      repostMarginValue: null,
      repostEditedRate: null,
      repostEditOwnBase: null,
    };
    const packB = {
      id: 'pack-b',
      companyId: 'co-b',
      rate: null,
      rateVisibility: RateVisibility.Visible,
      repostSourceCollectionId: 'pack-a',
      repostPricingMode: RepostPricingMode.Same,
      repostMarginValue: null,
      repostEditedRate: null,
      repostEditOwnBase: null,
    };

    const prisma = {
      collectionProduct: {
        findMany: vi.fn(async ({ where }: { where: { collectionId: string } }) => {
          if (where.collectionId === 'pack-a') {
            return [
              {
                productId: 'p1',
                pricingMode: null,
                marginValue: null,
                editedRate: null,
                editOwnBase: null,
                product: { id: 'p1', rate: 100, companyId: 'mill' },
              },
            ];
          }
          return [
            {
              productId: 'p1',
              pricingMode: null,
              marginValue: null,
              editedRate: null,
              editOwnBase: null,
              product: { id: 'p1', rate: 100, companyId: 'mill' },
            },
          ];
        }),
      },
      collection: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === 'pack-b') {
            return {
              ...packB,
              products: [
                {
                  productId: 'p1',
                  pricingMode: null,
                  marginValue: null,
                  editedRate: null,
                  editOwnBase: null,
                  product: { id: 'p1', rate: 100 },
                },
              ],
            };
          }
          if (where.id === 'pack-a') {
            return {
              ...packA,
              products: [
                {
                  productId: 'p1',
                  pricingMode: null,
                  marginValue: null,
                  editedRate: null,
                  editOwnBase: null,
                  product: { id: 'p1', rate: 100 },
                },
              ],
            };
          }
          return null;
        }),
      },
    };

    const resolved = await resolvePackMemberBuyerRates(
      prisma as never,
      packA,
      { viewerCompanyId: 'co-a', sourceDisclosed: true },
    );
    // Fail closed on the ₹ — no mill fallback. Disclosure may be true when the
    // immediate hop exists but its resolved buyer-facing is empty after a cycle.
    expect(resolved.get('p1')?.buyerFacing).toBeNull();
    expect(resolved.get('p1')?.sourceRate).toBeNull();
  });

  it('applies Edit calc on product-sourced children (no collection hop)', async () => {
    const pack = {
      id: 'child',
      companyId: 'trader',
      rate: null,
      rateVisibility: RateVisibility.Visible,
      repostSourceCollectionId: null,
      repostSourceProductId: 'p1',
      repostPricingMode: RepostPricingMode.Edit,
      repostMarginValue: null,
      repostEditedRate: 150,
      repostEditOwnBase: 100,
    };
    const prisma = {
      collectionProduct: {
        findMany: vi.fn(async () => [
          {
            productId: 'p1',
            pricingMode: null,
            marginValue: null,
            editedRate: null,
            editOwnBase: null,
            product: { id: 'p1', rate: 100, companyId: 'mill' },
          },
        ]),
      },
      collection: { findUnique: vi.fn() },
    };
    const resolved = await resolvePackMemberBuyerRates(prisma as never, pack, {
      viewerCompanyId: 'buyer',
      sourceDisclosed: true,
    });
    expect(resolved.get('p1')?.buyerFacing).toBe(150);
    expect(prisma.collection.findUnique).not.toHaveBeenCalled();
  });
});
