import { describe, expect, it, vi } from 'vitest';
import { ConnectionStatus } from '@ekum/domain-types';
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
          connectionsAsOwner: {
            none: { viewerCompanyId: 'viewer', status: ConnectionStatus.Blocked },
          },
        }),
      }),
    );
  });
});

describe('SearchService.designs', () => {
  it('searches published designs and excludes owners who blocked the viewer', async () => {
    const findMany = vi.fn(async () => []);
    const prisma = {
      product: { findMany },
    } as unknown as PrismaService;
    const discovery = {
      toProductCard: () => ({}),
    } as unknown as DiscoverySerializer;
    const service = new SearchService(prisma, discovery);

    await service.search('viewer', { q: 'Banarasi', type: 'design', limit: 20 });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'published',
          company: {
            connectionsAsOwner: {
              none: { viewerCompanyId: 'viewer', status: ConnectionStatus.Blocked },
            },
          },
        }),
      }),
    );
  });
});
