import { describe, expect, it, vi } from 'vitest';
import { idsMatchingCategoryLabel } from './categories-match';
import type { PrismaService } from '../core/prisma/prisma.service';

describe('idsMatchingCategoryLabel', () => {
  it('returns empty without querying when q is blank', async () => {
    const $queryRaw = vi.fn();
    const prisma = { $queryRaw } as unknown as PrismaService;

    await expect(idsMatchingCategoryLabel(prisma, 'Collection', '   ')).resolves.toEqual([]);
    expect($queryRaw).not.toHaveBeenCalled();
  });

  it('returns ids from case-insensitive unnest match', async () => {
    const $queryRaw = vi.fn(async () => [{ id: 'a' }, { id: 'b' }]);
    const prisma = { $queryRaw } as unknown as PrismaService;

    await expect(idsMatchingCategoryLabel(prisma, 'Product', 'Bedsheet')).resolves.toEqual([
      'a',
      'b',
    ]);
    expect($queryRaw).toHaveBeenCalledOnce();
  });
});
