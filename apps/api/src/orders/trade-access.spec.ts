import { describe, expect, it } from 'vitest';
import { ForbiddenException, NotFoundException, type HttpException } from '@nestjs/common';
import { TradeAccess } from './trade-access';
import { VisibilityService } from '../access/visibility.service';
import type { PrismaService } from '../core/prisma/prisma.service';

/**
 * Trust rule: trade is gated by an active connection, and a block is silent.
 * These tests run the real VisibilityService against a stubbed connection row so
 * the actual gate logic (not a mock of it) is exercised.
 */
function makeTradeAccess(connectionStatus: string | null): TradeAccess {
  const visibilityPrisma = {
    connection: { findUnique: async () => (connectionStatus ? { status: connectionStatus } : null) },
  } as unknown as PrismaService;
  const visibility = new VisibilityService(visibilityPrisma);
  const prisma = {
    company: { findUnique: async () => ({ id: 'seller' }) },
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

describe('TradeAccess.assertCanTrade', () => {
  it('permits trade between actively connected companies', async () => {
    const trade = makeTradeAccess('active');
    await expect(trade.assertCanTrade('buyer', 'seller')).resolves.toBeUndefined();
  });

  it('returns 404 (not 403) when the seller has blocked the buyer', async () => {
    const trade = makeTradeAccess('blocked');
    const { error } = await codeOf(trade.assertCanTrade('buyer', 'seller'));
    expect(error).toBeInstanceOf(NotFoundException);
  });

  it('requires a connection before ordering when none exists', async () => {
    const trade = makeTradeAccess(null);
    const { error, code } = await codeOf(trade.assertCanTrade('buyer', 'seller'));
    expect(error).toBeInstanceOf(ForbiddenException);
    expect(code).toBe('CONNECTION_REQUIRED');
  });
});
