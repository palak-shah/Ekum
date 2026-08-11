import { randomBytes } from 'node:crypto';
import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../core/prisma/prisma.service';

/** Generates a short stable SKU (e.g. EK-A1B2C3D4). */
export function generateProductSku(): string {
  return `EK-${randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * Resolves the SKU to persist: trim user value, or generate until unique
 * within the company. Existing SKUs are never overwritten by callers.
 */
export async function resolveProductSku(
  prisma: PrismaService,
  companyId: string,
  requested: string | null | undefined,
  excludeProductId?: string,
): Promise<string> {
  const trimmed = requested?.trim();
  if (trimmed) {
    const clash = await prisma.product.findFirst({
      where: {
        companyId,
        sku: trimmed,
        ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
      },
      select: { id: true },
    });
    if (clash) {
      throw new ConflictException({
        code: 'SKU_TAKEN',
        message: 'That SKU is already used on another design.',
      });
    }
    return trimmed;
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateProductSku();
    const clash = await prisma.product.findFirst({
      where: { companyId, sku: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  throw new ConflictException({
    code: 'SKU_GENERATE_FAILED',
    message: 'Could not assign a SKU. Try again.',
  });
}
