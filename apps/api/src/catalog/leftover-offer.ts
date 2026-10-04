import { ProductStatus } from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';

export const LEFTOVER_OFFER_REASON = 'No longer available';

/** Status map for leftover pointers. Missing id → null (deleted). */
export async function productCatalogStatusById(
  prisma: Pick<PrismaService, 'product'>,
  productIds: Array<string | null | undefined>,
): Promise<Map<string, string | null>> {
  const ids = [...new Set(productIds.filter((id): id is string => Boolean(id)))];
  const map = new Map<string, string | null>();
  if (ids.length === 0) return map;
  const rows = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true },
  });
  for (const row of rows) map.set(row.id, row.status);
  for (const id of ids) {
    if (!map.has(id)) map.set(id, null);
  }
  return map;
}

export function leftoverOfferFromCatalogStatus(
  productId: string | null | undefined,
  catalogStatus: string | null | undefined,
): string | null {
  if (!productId) return null;
  if (catalogStatus === undefined) return null;
  if (catalogStatus === ProductStatus.Published) return null;
  return LEFTOVER_OFFER_REASON;
}
