import { describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { CompanyService } from './company.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { TokenService } from '../auth/token.service';
import type { CompanySerializer } from '../access/company.serializer';
import type { VisibilityService } from '../access/visibility.service';

function makeService(opts: {
  blocked?: boolean;
  company?: { id: string } | null;
  collections?: Array<{
    id: string;
    name: string;
    coverImage: string | null;
    status: string;
    updatedAt: Date;
    company: { id: string; name: string };
    _count: { products: number };
    products?: Array<{ product: { images: string[] } }>;
  }>;
}) {
  const prisma = {
    company: {
      findUnique: async () => opts.company ?? null,
    },
    collection: {
      findMany: async () => opts.collections ?? [],
    },
  } as unknown as PrismaService;
  const visibility = {
    isBlocked: async () => opts.blocked ?? false,
  } as unknown as VisibilityService;
  const serializer = {
    toPublicSummary: (company: { id: string; name: string }) => ({
      id: company.id,
      name: company.name,
      city: 'Surat',
      verification: 'not_verified',
      logoUrl: null,
    }),
  } as unknown as CompanySerializer;
  return new CompanyService(prisma, {} as TokenService, serializer, visibility);
}

describe('CompanyService.listPublishedCollections', () => {
  it('returns published collections for a visible business', async () => {
    const service = makeService({
      company: { id: 'seller' },
      collections: [
        {
          id: 'c1',
          name: 'Wedding Edit',
          coverImage: 'https://img/cover',
          status: 'published',
          updatedAt: new Date('2026-08-01T00:00:00.000Z'),
          company: { id: 'seller', name: 'Surat Silk House' },
          _count: { products: 4 },
          products: [
            { product: { images: ['https://img/a'] } },
            { product: { images: ['https://img/b'] } },
          ],
        },
      ],
    });
    const page = await service.listPublishedCollections('buyer', 'seller', { limit: 20 });
    expect(page.results).toHaveLength(1);
    expect(page.results[0]?.name).toBe('Wedding Edit');
    expect(page.results[0]?.productCount).toBe(4);
    expect(page.results[0]?.previewImages).toEqual([
      'https://img/cover',
      'https://img/a',
      'https://img/b',
    ]);
    expect(page.results[0]?.imageCount).toBe(3);
    expect(page.nextCursor).toBeNull();
  });

  it('404s blocked viewers without confirming the block', async () => {
    const service = makeService({ blocked: true, company: { id: 'seller' } });
    await expect(
      service.listPublishedCollections('buyer', 'seller', { limit: 20 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('404s a missing business', async () => {
    const service = makeService({ company: null });
    await expect(
      service.listPublishedCollections('buyer', 'missing', { limit: 20 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
