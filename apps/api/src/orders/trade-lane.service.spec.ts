import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TradeLaneTicket } from '@ekum/domain-types';
import { TradeLaneService } from './trade-lane.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { ThreadService } from '../conversation/thread.service';

function allowedFollowPrisma() {
  return {
    companySettings: {
      findUnique: vi.fn(async () => ({ tradeDefaults: { tradingEnabled: true } })),
    },
    follow: {
      findUnique: vi.fn(async () => ({ status: 'allowed' })),
    },
  };
}

describe('TradeLaneService', () => {
  it('rejects ticket/reveal edits', async () => {
    const existing = {
      id: 'lane-1',
      traderCompanyId: 'trader',
      sellerCompanyId: 'mill',
      buyerCompanyId: 'buyer',
      ticket: TradeLaneTicket.Mill,
      reveal: true,
      groupThreadId: null,
      updatedAt: new Date('2026-10-01'),
      seller: { id: 'mill', name: 'Mill' },
      buyer: { id: 'buyer', name: 'Buyer' },
    };
    const prisma = {
      companySettings: {
        findUnique: vi.fn(async () => ({ tradeDefaults: { tradingEnabled: true } })),
      },
      tradeLane: { findFirst: vi.fn(async () => existing) },
    } as unknown as PrismaService;
    const service = new TradeLaneService(prisma, {} as ThreadService);
    await expect(service.update('trader', 'lane-1', { reveal: true })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lists Direct Links only', async () => {
    const prisma = {
      ...allowedFollowPrisma(),
      tradeLane: { findMany: vi.fn(async () => []) },
    } as unknown as PrismaService;
    const service = new TradeLaneService(prisma, {} as ThreadService);
    await service.list('trader', {});
    expect(prisma.tradeLane.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ticket: TradeLaneTicket.Mill }),
      }),
    );
  });

  it('creates from follow graph with mill ticket and group on', async () => {
    const prisma = {
      ...allowedFollowPrisma(),
      tradeLane: {
        upsert: vi.fn(async () => ({
          id: 'lane-new',
          traderCompanyId: 'trader',
          sellerCompanyId: 'mill',
          buyerCompanyId: 'buyer',
          ticket: TradeLaneTicket.Mill,
          reveal: true,
          groupThreadId: null,
          behaviors: { directOrder: true, autoRepost: false },
          updatedAt: new Date('2026-10-28'),
          seller: { id: 'mill', name: 'Mill Co' },
          buyer: { id: 'buyer', name: 'Buyer Co' },
        })),
        update: vi.fn(async () => ({})),
      },
      collection: { findMany: vi.fn(async () => []) },
    } as unknown as PrismaService;
    const ensureTradeLaneGroup = vi.fn(async () => 'trio-1');
    const service = new TradeLaneService(prisma, {
      ensureTradeLaneGroup,
    } as unknown as ThreadService);
    const view = await service.create('trader', {
      sellerCompanyId: 'mill',
      buyerCompanyId: 'buyer',
    });
    expect(view.ticket).toBe('mill');
    expect(view.reveal).toBe(true);
    expect(ensureTradeLaneGroup).toHaveBeenCalledWith('trader', 'mill', 'buyer', null);
    expect(prisma.tradeLane.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lane-new' },
        data: { groupThreadId: 'trio-1' },
      }),
    );
    expect(prisma.tradeLane.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          ticket: TradeLaneTicket.Mill,
          reveal: true,
        }),
      }),
    );
  });

  it('reuses the existing trio instead of opening another group', async () => {
    const prisma = {
      ...allowedFollowPrisma(),
      tradeLane: {
        upsert: vi.fn(async () => ({
          id: 'lane-new',
          traderCompanyId: 'trader',
          sellerCompanyId: 'mill',
          buyerCompanyId: 'buyer',
          ticket: TradeLaneTicket.Mill,
          reveal: true,
          groupThreadId: 'trio-1',
          behaviors: { directOrder: true, autoRepost: false },
          updatedAt: new Date('2026-10-28'),
          seller: { id: 'mill', name: 'Mill Co' },
          buyer: { id: 'buyer', name: 'Buyer Co' },
        })),
        update: vi.fn(async () => ({})),
      },
      collection: { findMany: vi.fn(async () => []) },
    } as unknown as PrismaService;
    const ensureTradeLaneGroup = vi.fn(async () => 'trio-1');
    const service = new TradeLaneService(prisma, {
      ensureTradeLaneGroup,
    } as unknown as ThreadService);
    await service.create('trader', {
      sellerCompanyId: 'mill',
      buyerCompanyId: 'buyer',
    });
    expect(ensureTradeLaneGroup).toHaveBeenCalledWith('trader', 'mill', 'buyer', 'trio-1');
    expect(prisma.tradeLane.update).not.toHaveBeenCalled();
  });

  it('rejects create when mill is not followed', async () => {
    const prisma = {
      companySettings: {
        findUnique: vi.fn(async () => ({ tradeDefaults: { tradingEnabled: true } })),
      },
      follow: { findUnique: vi.fn(async () => null) },
    } as unknown as PrismaService;
    const service = new TradeLaneService(prisma, {} as ThreadService);
    await expect(
      service.create('trader', { sellerCompanyId: 'mill', buyerCompanyId: 'buyer' }),
    ).rejects.toMatchObject({
      response: { message: 'Follow that supplier first.' },
    });
  });
});
