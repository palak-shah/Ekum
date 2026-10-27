import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { CollectionKind } from '@ekum/domain-types';
import {
  assertNotGeneralMutation,
  ensureGeneralCollection,
  generalMemberJoinRows,
  generalMemberProductWhere,
  isCatalogKind,
  isGeneralKind,
  packNoun,
  publicCollectionKindWhere,
} from './general-collection';

describe('general collection identity', () => {
  it('identifies by kind flag, never by name', () => {
    expect(isGeneralKind(CollectionKind.General)).toBe(true);
    expect(isGeneralKind(CollectionKind.Regular)).toBe(false);
    expect(isGeneralKind('General Collection')).toBe(false);
    expect(isCatalogKind(CollectionKind.Catalog)).toBe(true);
    expect(packNoun(CollectionKind.Catalog)).toBe('catalog');
    expect(packNoun(CollectionKind.Regular)).toBe('collection');
    expect(publicCollectionKindWhere()).toEqual({ kind: { not: CollectionKind.General } });
  });

  it('includes draft and published unassigned designs, not deleted', () => {
    const where = generalMemberProductWhere('co-1');
    expect(where.companyId).toBe('co-1');
    expect(where.status).toEqual({ not: 'archived' });
    expect(where.collections).toMatchObject({
      none: { collection: { companyId: 'co-1', kind: { in: ['regular', 'catalog'] } } },
    });
  });

  it('shapes leftover products as GC join rows', () => {
    const createdAt = new Date('2026-10-24T00:00:00.000Z');
    expect(
      generalMemberJoinRows('gc-1', [{ id: 'p1', createdAt, name: 'Saree' }]),
    ).toEqual([
      {
        id: 'gc_p1',
        collectionId: 'gc-1',
        productId: 'p1',
        position: 0,
        createdAt,
        product: { id: 'p1', createdAt, name: 'Saree' },
      },
    ]);
  });

  it('blocks mutations on General Collection', () => {
    expect(() => assertNotGeneralMutation('general', 'cannot be edited this way')).toThrow(
      BadRequestException,
    );
    expect(() => assertNotGeneralMutation('regular', 'x')).not.toThrow();
  });

  it('creates a general row when missing and keeps an existing one', async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce({
        id: 'gc_co-1',
        name: 'My leftovers',
        kind: CollectionKind.General,
        status: 'published',
      });
    const create = vi.fn();
    const existing = await ensureGeneralCollection(
      { collection: { findFirst, create } },
      'co-1',
      'u1',
    );
    expect(existing).toEqual({ id: 'gc_co-1', name: 'My leftovers' });
    expect(create).not.toHaveBeenCalled();

    findFirst.mockReset();
    findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({ id: 'gc_co-2' });
    const created = await ensureGeneralCollection(
      { collection: { findFirst, create } },
      'co-2',
      'u1',
    );
    expect(created.id).toBe('gc_co-2');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          kind: CollectionKind.General,
          name: 'General Collection',
          status: 'published',
        }),
      }),
    );
  });
});
