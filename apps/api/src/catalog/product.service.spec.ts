import { describe, expect, it, vi } from 'vitest';
import { ProductStatus } from '@ekum/domain-types';
import { ProductService } from './product.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { CatalogSerializer } from './catalog.serializer';

function setup(canPublish: boolean) {
  const update = vi.fn(async () => ({ id: 'p1', status: ProductStatus.Published }));
  const prisma = {
    product: { findFirst: async () => ({ id: 'p1', companyId: 'c1' }), update },
    company: { findUnique: async () => ({ canPublish }) },
  } as unknown as PrismaService;
  const serializer = {
    toProductView: (product: unknown) => product,
  } as unknown as CatalogSerializer;
  return { service: new ProductService(prisma, serializer), update };
}

describe('ProductService.setStatus publish gate', () => {
  it('blocks publishing when the company cannot publish', async () => {
    const { service, update } = setup(false);
    await expect(service.setStatus('c1', 'p1', ProductStatus.Published)).rejects.toThrow();
    expect(update).not.toHaveBeenCalled();
  });

  it('allows publishing when the company can publish', async () => {
    const { service, update } = setup(true);
    await service.setStatus('c1', 'p1', ProductStatus.Published);
    expect(update).toHaveBeenCalled();
  });

  it('does not gate archiving', async () => {
    const { service, update } = setup(false);
    await service.setStatus('c1', 'p1', ProductStatus.Archived);
    expect(update).toHaveBeenCalled();
  });
});
