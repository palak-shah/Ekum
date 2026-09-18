import { describe, expect, it, vi } from 'vitest';
import { companyNotBlockedWith } from '../access/connection-pair';
import { SearchService } from './search.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { DiscoverySerializer } from './discovery.serializer';

describe('SearchService.companies', () => {
  it('excludes companies that have blocked the viewer', async () => {
    const findMany = vi.fn(async () => []);
    const prisma = {
      company: { findMany },
    } as unknown as PrismaService;
    const discovery = {
      toCompanyCard: (row: { id: string }) => ({ id: row.id }),
    } as unknown as DiscoverySerializer;
    const service = new SearchService(prisma, discovery);

    await service.search('viewer', { q: 'Surat', type: 'company', limit: 20 });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: 'viewer' },
          ...companyNotBlockedWith('viewer'),
        }),
      }),
    );
  });
});

describe('SearchService.designs', () => {
  it('searches published designs and excludes owners who blocked the viewer', async () => {
    const findMany = vi.fn(async () => []);
    const $queryRaw = vi.fn(async () => []);
    const prisma = {
      product: { findMany },
      $queryRaw,
    } as unknown as PrismaService;
    const discovery = {
      toProductCard: () => ({}),
    } as unknown as DiscoverySerializer;
    const service = new SearchService(prisma, discovery);

    await service.search('viewer', { q: 'Banarasi', type: 'design', limit: 20 });

    expect($queryRaw).toHaveBeenCalled();
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'published',
          company: companyNotBlockedWith('viewer'),
        }),
      }),
    );
  });

  it('matches design tags case-insensitively via category id lookup', async () => {
    const findMany = vi.fn(async () => []);
    const $queryRaw = vi.fn(async () => [{ id: 'p-bedsheet' }]);
    const prisma = {
      product: { findMany },
      $queryRaw,
    } as unknown as PrismaService;
    const discovery = {
      toProductCard: () => ({}),
    } as unknown as DiscoverySerializer;
    const service = new SearchService(prisma, discovery);

    await service.search('viewer', { q: 'bedsheet', type: 'design', limit: 20 });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ id: { in: ['p-bedsheet'] } }]),
        }),
      }),
    );
  });
});

describe('SearchService.collections', () => {
  it('matches collection tags case-insensitively via category id lookup', async () => {
    const findMany = vi.fn(async () => []);
    const $queryRaw = vi.fn(async () => [{ id: 'c-bedsheet' }]);
    const prisma = {
      collection: { findMany },
      $queryRaw,
    } as unknown as PrismaService;
    const discovery = {
      toCollectionCard: () => ({}),
    } as unknown as DiscoverySerializer;
    const service = new SearchService(prisma, discovery);

    await service.search('viewer', { q: 'bedsheet', type: 'collection', limit: 20 });

    expect($queryRaw).toHaveBeenCalled();
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ id: { in: ['c-bedsheet'] } }]),
        }),
      }),
    );
    const where = findMany.mock.calls[0]?.[0]?.where as { OR: unknown[] };
    expect(where.OR.some((clause) => clause && typeof clause === 'object' && 'categories' in clause)).toBe(
      false,
    );
  });
});
