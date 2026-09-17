import { describe, expect, it, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';
import {
  CatalogTagService,
  parentKeysFromCompanyCategories,
} from './catalog-tag.service';
import type { PrismaService } from '../core/prisma/prisma.service';

describe('parentKeysFromCompanyCategories', () => {
  it('maps superCategories onto taxonomy Main Category keys', () => {
    expect(
      parentKeysFromCompanyCategories([], ['home_furnishing', 'womens_apparel']),
    ).toEqual(expect.arrayContaining(['HOME TEXTILES', 'WOMENS WEAR']));
  });

  it('maps sellCategories aliases including fabrics and kids', () => {
    expect(parentKeysFromCompanyCategories(['fabrics', 'Kids Wear'], [])).toEqual(
      expect.arrayContaining(['FABRICS', 'KIDS WEAR']),
    );
  });

  it('returns empty when nothing maps (caller shows all official tags)', () => {
    expect(parentKeysFromCompanyCategories(['sarees', 'kurtis'], [])).toEqual([]);
  });
});

describe('CatalogTagService', () => {
  it('lists filtered official tags plus company custom tags', async () => {
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: 'off-1',
          scope: 'official',
          companyId: null,
          label: 'Bedsheet',
          parentKey: 'HOME TEXTILES',
          status: 'verified',
          createdAt: new Date('2026-01-01'),
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'co-1',
          scope: 'company',
          companyId: 'c1',
          label: 'Fendi',
          parentKey: null,
          status: 'pending',
          createdAt: new Date('2026-01-02'),
        },
      ]);
    const prisma = {
      company: {
        findUnique: async () => ({
          sellCategories: [],
          superCategories: ['home_furnishing'],
        }),
      },
      catalogTag: { findMany },
    } as unknown as PrismaService;

    const service = new CatalogTagService(prisma);
    const rows = await service.list('c1');
    expect(findMany).toHaveBeenCalledTimes(2);
    expect(findMany.mock.calls[0][0].where).toMatchObject({
      scope: 'official',
      parentKey: { in: ['HOME TEXTILES'] },
    });
    expect(rows.map((r) => r.label)).toEqual(['Bedsheet', 'Fendi']);
  });

  it('creates a pending company tag', async () => {
    const create = vi.fn(async () => ({
      id: 't1',
      scope: 'company',
      companyId: 'c1',
      label: 'Fendi',
      parentKey: null,
      status: 'pending',
      createdAt: new Date('2026-01-01'),
    }));
    const prisma = {
      catalogTag: {
        findFirst: async () => null,
        count: async () => 0,
        create,
      },
    } as unknown as PrismaService;

    const service = new CatalogTagService(prisma);
    const view = await service.create('c1', { label: '  Fendi  ' });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          label: 'Fendi',
          scope: 'company',
          status: 'pending',
          companyId: 'c1',
        }),
      }),
    );
    expect(view.label).toBe('Fendi');
    expect(view.status).toBe('pending');
  });

  it('rejects duplicate company tags case-insensitively', async () => {
    const prisma = {
      catalogTag: {
        findFirst: async () => ({
          id: 't1',
          label: 'Fendi',
        }),
        count: async () => 1,
        create: vi.fn(),
      },
    } as unknown as PrismaService;

    const service = new CatalogTagService(prisma);
    await expect(service.create('c1', { label: 'fendi' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
