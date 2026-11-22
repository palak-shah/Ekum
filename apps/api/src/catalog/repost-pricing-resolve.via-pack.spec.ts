import { describe, expect, it, vi } from 'vitest';
import { RateVisibility, RepostPricingMode } from '@ekum/domain-types';
import { buyerFacingViaCuratedPackForProduct } from './repost-pricing-resolve';
import type { PrismaService } from '../core/prisma/prisma.service';

function decimal(n: number | null) {
  if (n == null) return null;
  return { toNumber: () => n };
}

describe('buyerFacingViaCuratedPackForProduct', () => {
  it('returns trader Edit rate instead of mill Product.rate', async () => {
    const prisma = {
      collectionProduct: {
        findMany: vi.fn(async (args: { where?: { productId?: string; collectionId?: string } }) => {
          if (args.where?.productId === 'sku-1') {
            return [
              {
                collection: {
                  id: 'pack-trader',
                  companyId: 'trader',
                  rate: null,
                  rateVisibility: RateVisibility.Visible,
                  repostSourceCollectionId: 'pack-mill',
                  repostPricingMode: RepostPricingMode.Edit,
                  repostMarginValue: null,
                  repostEditedRate: decimal(125),
                  repostEditOwnBase: null,
                },
              },
            ];
          }
          if (args.where?.collectionId === 'pack-trader') {
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
          if (args.where?.collectionId === 'pack-mill') {
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
      collection: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === 'pack-mill') {
            return {
              id: 'pack-mill',
              companyId: 'mill',
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
    } as unknown as PrismaService;

    const rate = await buyerFacingViaCuratedPackForProduct(
      prisma,
      'buyer',
      'sku-1',
      'mill',
    );
    expect(rate).toBe(125);
  });

  it('hides when only On-request calc packs exist', async () => {
    const prisma = {
      collectionProduct: {
        findMany: vi.fn(async () => [
          {
            collection: {
              id: 'pack-trader',
              companyId: 'trader',
              rate: null,
              rateVisibility: RateVisibility.OnRequest,
              repostSourceCollectionId: null,
              repostPricingMode: RepostPricingMode.Edit,
              repostMarginValue: null,
              repostEditedRate: decimal(125),
              repostEditOwnBase: null,
            },
          },
        ]),
      },
      collection: { findUnique: vi.fn(async () => null) },
    } as unknown as PrismaService;

    const rate = await buyerFacingViaCuratedPackForProduct(
      prisma,
      'buyer',
      'sku-1',
      'mill',
    );
    expect(rate).toBeNull();
  });
});
