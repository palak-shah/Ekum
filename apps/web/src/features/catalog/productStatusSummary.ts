import type { BuyerGroupName } from './collectionStatusSummary';
import { whoCanSeeLabel } from './collectionStatusSummary';
import type { ProductView } from '@ekum/domain-types';
import { ProductStatus } from '@ekum/domain-types';
import { formatRate } from '@/lib/format';

/** One-line current truth for design tiles and Edit design. */
export function productStatusLine(
  product: ProductView,
  groups: BuyerGroupName[] = [],
): string {
  if (product.status === ProductStatus.Archived) {
    return 'Archived';
  }
  if (product.status === ProductStatus.Draft) {
    return 'Draft';
  }
  const who = whoCanSeeLabel(
    {
      status: product.status,
      audience: product.audience,
      audienceCompanyIds: product.audienceCompanyIds,
      audienceGroupIds: product.audienceGroupIds,
    },
    groups,
  );
  return who ? `Published · ${who}` : 'Published';
}

/** Glanceable tile: rate · SKU · photos, then status. */
export function productTileSubtitle(
  product: ProductView,
  groups: BuyerGroupName[] = [],
): string {
  const bits: string[] = [];
  const rate = formatRate(product.rate, product.unit);
  if (rate !== 'On request') bits.push(rate);
  else if (product.rate == null) bits.push('On request');
  if (product.sku) bits.push(product.sku);
  const photos = product.images.length;
  bits.push(photos === 1 ? '1 photo' : `${photos} photos`);
  bits.push(productStatusLine(product, groups));
  return bits.join(' · ');
}

export function auditLine(input: {
  createdAt: string;
  updatedAt?: string;
  createdBy?: { name: string | null } | null;
  updatedBy?: { name: string | null } | null;
}): string | null {
  const who =
    input.updatedBy?.name ||
    input.createdBy?.name ||
    null;
  const when = input.updatedAt || input.createdAt;
  if (!who && !when) return null;
  const date = new Date(when).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
  return who ? `${who} · ${date}` : date;
}
