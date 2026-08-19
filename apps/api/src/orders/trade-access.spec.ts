import { describe, expect, it } from 'vitest';
import { ForbiddenException, NotFoundException, type HttpException } from '@nestjs/common';
import { ProductStatus } from '@ekum/domain-types';
import { TradeAccess } from './trade-access';
import { VisibilityService } from '../access/visibility.service';
import type { PrismaService } from '../core/prisma/prisma.service';

/**
 * Trust rule: connected always trades; open (discoverable) products trade without
 * connection; restricted audiences still need connection; block stays silent.
 */
function makeTradeAccess(options: {
  connectionStatus: string | null;
  products?: Array<{
    id: string;
    companyId: string;
    audience: string;
    audienceCompanyIds?: string[];
    status?: string;
    postedToMarketAt?: Date | null;
  }>;
  following?: boolean;
}): TradeAccess {
  const visibilityPrisma = {
    connection: {
      findUnique: async () =>
        options.connectionStatus ? { status: options.connectionStatus } : null,
    },
  } as unknown as PrismaService;
  const visibility = new VisibilityService(visibilityPrisma);
  const products = options.products ?? [];
  const prisma = {
    company: { findUnique: async () => ({ id: 'seller' }) },
    product: {
      findMany: async ({ where }: { where: { id: { in: string[] } } }) =>
        products.filter((row) => where.id.in.includes(row.id)),
    },
    connection: {
      findFirst: async () =>
        options.connectionStatus === 'active' ? { id: 'c1' } : null,
    },
    follow: {
      findFirst: async () => (options.following ? { id: 'f1' } : null),
    },
  } as unknown as PrismaService;
  return new TradeAccess(prisma, visibility);
}

async function codeOf(promise: Promise<unknown>): Promise<{ error: unknown; code: unknown }> {
  try {
    await promise;
    return { error: null, code: null };
  } catch (error) {
    const response = (error as HttpException).getResponse() as { code?: string };
    return { error, code: response.code };
  }
}

const openProduct = {
  id: 'p1',
  companyId: 'seller',
  audience: 'everyone',
  audienceCompanyIds: [] as string[],
  status: ProductStatus.Published,
  postedToMarketAt: new Date('2026-01-01'),
};

describe('TradeAccess.assertCanTrade', () => {
  it('permits trade between actively connected companies', async () => {
    const trade = makeTradeAccess({ connectionStatus: 'active' });
    await expect(trade.assertCanTrade('buyer', 'seller')).resolves.toBeUndefined();
  });

  it('returns 404 (not 403) when the seller has blocked the buyer', async () => {
    const trade = makeTradeAccess({ connectionStatus: 'blocked' });
    const { error } = await codeOf(trade.assertCanTrade('buyer', 'seller'));
    expect(error).toBeInstanceOf(NotFoundException);
  });

  it('requires a connection when no open products are offered', async () => {
    const trade = makeTradeAccess({ connectionStatus: null });
    const { error, code } = await codeOf(trade.assertCanTrade('buyer', 'seller'));
    expect(error).toBeInstanceOf(ForbiddenException);
    expect(code).toBe('CONNECTION_REQUIRED');
  });

  it('allows order without connection when every product is everyone-audience', async () => {
    const trade = makeTradeAccess({
      connectionStatus: null,
      products: [openProduct],
    });
    await expect(
      trade.assertCanTrade('buyer', 'seller', { productIds: ['p1'] }),
    ).resolves.toBeUndefined();
  });

  it('rejects connections-only product without an active connection', async () => {
    const trade = makeTradeAccess({
      connectionStatus: null,
      products: [
        {
          ...openProduct,
          audience: 'connections',
        },
      ],
    });
    const { error, code } = await codeOf(
      trade.assertCanTrade('buyer', 'seller', { productIds: ['p1'] }),
    );
    expect(error).toBeInstanceOf(ForbiddenException);
    expect(code).toBe('CONNECTION_REQUIRED');
  });

  it('allows followers-audience product when the buyer follows', async () => {
    const trade = makeTradeAccess({
      connectionStatus: null,
      following: true,
      products: [{ ...openProduct, audience: 'followers' }],
    });
    await expect(
      trade.assertCanTrade('buyer', 'seller', { productIds: ['p1'] }),
    ).resolves.toBeUndefined();
  });
});
