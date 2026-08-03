import { describe, expect, it, vi } from 'vitest';
import { CollectionService } from './collection.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { CatalogSerializer } from './catalog.serializer';

describe('CollectionService.setProducts', () => {
  it('rejects products that do not belong to the acting company', async () => {
    const transaction = vi.fn(async () => []);
    const prisma = {
      collection: { findFirst: async () => ({ id: 'col-1', companyId: 'company-1' }) },
      // Only one of the two requested products belongs to the company.
      product: { count: async () => 1 },
      $transaction: transaction,
    } as unknown as PrismaService;
    const serializer = {} as unknown as CatalogSerializer;

    const service = new CollectionService(prisma, serializer);
    await expect(service.setProducts('company-1', 'col-1', ['p1', 'p2'])).rejects.toThrow();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('hides collections owned by another company', async () => {
    const prisma = {
      collection: { findFirst: async () => null },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as unknown as CatalogSerializer);
    await expect(service.setProducts('company-1', 'col-1', ['p1'])).rejects.toThrow();
  });
});
