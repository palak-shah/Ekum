import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TradeLaneTicket } from '@ekum/domain-types';
import { TradeLaneService } from './trade-lane.service';
import type { PrismaService } from '../core/prisma/prisma.service';

function allowedFollowPrisma(accessKind: 'look' | 'pack' = 'pack') {
  return {
    companySettings: {
      findUnique: vi.fn(async () => ({ tradeDefaults: { tradingEnabled: true } })),
    },
    follow: {
      findUnique: vi.fn(async () => ({ status: 'allowed', accessKind })),
      findMany: vi.fn(async () =>
        accessKind === 'pack' ? [{ followedCompanyId: 'mill' }] : [],
      ),
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
    const service = new TradeLaneService(prisma);
    await expect(service.update('trader', 'lane-1', { reveal: true })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lists Direct Links only', async () => {
    const prisma = {
      ...allowedFollowPrisma(),
      tradeLane: { findMany: vi.fn(async () => []) },
    } as unknown as PrismaService;
    const service = new TradeLaneService(prisma);
    await service.list('trader', {});
    expect(prisma.tradeLane.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ticket: TradeLaneTicket.Mill }),
      }),
    );
  });

  it('creates from follow graph with mill ticket and no trio', async () => {
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
    const service = new TradeLaneService(prisma);
    const view = await service.create('trader', {
      sellerCompanyId: 'mill',
      buyerCompanyId: 'buyer',
    });
    expect(view.ticket).toBe('mill');
    expect(view.reveal).toBe(true);
    expect(view.shareActive).toBe(true);
    expect(prisma.tradeLane.update).not.toHaveBeenCalled();
    expect(prisma.tradeLane.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          ticket: TradeLaneTicket.Mill,
          reveal: true,
        }),
      }),
    );
  });

  it('rejects create when mill has not granted Share', async () => {
    const prisma = {
      ...allowedFollowPrisma('look'),
    } as unknown as PrismaService;
    const service = new TradeLaneService(prisma);
    await expect(
      service.create('trader', { sellerCompanyId: 'mill', buyerCompanyId: 'buyer' }),
    ).rejects.toMatchObject({
      response: { code: 'SHARE_REQUIRED', message: 'Ask them to share collections first.' },
    });
  });

  it('rejects create when mill is not followed', async () => {
    const prisma = {
      companySettings: {
        findUnique: vi.fn(async () => ({ tradeDefaults: { tradingEnabled: true } })),
      },
      follow: { findUnique: vi.fn(async () => null) },
    } as unknown as PrismaService;
    const service = new TradeLaneService(prisma);
    await expect(
      service.create('trader', { sellerCompanyId: 'mill', buyerCompanyId: 'buyer' }),
    ).rejects.toMatchObject({
      response: { message: 'Follow that supplier first.' },
    });
  });

  it('lists gray shareActive false when mill Share is off', async () => {
    const prisma = {
      ...allowedFollowPrisma('look'),
      tradeLane: {
        findMany: vi.fn(async () => [
          {
            id: 'lane-1',
            traderCompanyId: 'trader',
            sellerCompanyId: 'mill',
            buyerCompanyId: 'buyer',
            ticket: TradeLaneTicket.Mill,
            reveal: true,
            behaviors: { directOrder: true, autoRepost: false },
            updatedAt: new Date('2026-10-31'),
            seller: { id: 'mill', name: 'Mill Co' },
            buyer: { id: 'buyer', name: 'Buyer Co' },
          },
        ]),
      },
    } as unknown as PrismaService;
    const service = new TradeLaneService(prisma);
    const views = await service.list('trader', {});
    expect(views[0]?.shareActive).toBe(false);
  });

  it('routes Place I-handle when the mill ticket exists but Share is off', async () => {
    const prisma = {
      tradeLane: {
        findUnique: vi.fn(async () => ({ ticket: TradeLaneTicket.Mill })),
      },
      follow: {
        findUnique: vi.fn(async () => ({ status: 'allowed', accessKind: 'look' })),
      },
    } as unknown as PrismaService;
    const service = new TradeLaneService(prisma);
    await expect(service.pathForPair('trader', 'mill', 'buyer')).resolves.toBe('handle');
  });

  it('routes Place Direct when mill Share is on', async () => {
    const prisma = {
      tradeLane: {
        findUnique: vi.fn(async () => ({ ticket: TradeLaneTicket.Mill })),
      },
      follow: {
        findUnique: vi.fn(async () => ({ status: 'allowed', accessKind: 'pack' })),
      },
    } as unknown as PrismaService;
    const service = new TradeLaneService(prisma);
    await expect(service.pathForPair('trader', 'mill', 'buyer')).resolves.toBe('direct');
  });
});
