import { describe, expect, it, vi } from 'vitest';
import { generateProductSku, resolveProductSku } from './sku';
import type { PrismaService } from '../core/prisma/prisma.service';

describe('sku helpers', () => {
  it('generates EK- prefixed codes', () => {
    expect(generateProductSku()).toMatch(/^EK-[0-9A-F]{8}$/);
  });

  it('uses the requested SKU when unique', async () => {
    const prisma = {
      product: { findFirst: vi.fn(async () => null) },
    } as unknown as PrismaService;
    await expect(resolveProductSku(prisma, 'c1', 'SKU-1')).resolves.toBe('SKU-1');
  });

  it('rejects a duplicate company SKU', async () => {
    const prisma = {
      product: { findFirst: vi.fn(async () => ({ id: 'other' })) },
    } as unknown as PrismaService;
    await expect(resolveProductSku(prisma, 'c1', 'SKU-1')).rejects.toThrow();
  });

  it('generates when omitted', async () => {
    const prisma = {
      product: { findFirst: vi.fn(async () => null) },
    } as unknown as PrismaService;
    const sku = await resolveProductSku(prisma, 'c1', undefined);
    expect(sku).toMatch(/^EK-/);
  });
});
