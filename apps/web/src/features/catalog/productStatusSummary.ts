import type { BuyerGroupName } from './collectionStatusSummary';
import type { ProductView } from '@ekum/domain-types';
import { ProductStatus } from '@ekum/domain-types';
import { formatRate } from '@/lib/format';

/** Draft / pack-only / archived only — not On Explore or who can see. */
export function productStatusLine(
  product: ProductView,
  _groups: BuyerGroupName[] = [],
): string {
  if (product.status === ProductStatus.Archived) {
    return 'Archived';
  }
  if (product.status === ProductStatus.Draft) {
    return 'Draft';
  }
  /** Pack publish marks designs Published without a solo Explore tile. */
  if (!product.postedToMarketAt) {
    return 'In your packs';
  }
  return '';
}

/** Glanceable tile: rate · SKU · photos (status is a separate line). */
export function productTileSubtitle(product: ProductView): string {
  const bits: string[] = [];
  const rate = formatRate(product.rate, product.unit, product.rateMax);
  bits.push(rate === 'On request' || product.rate == null ? 'Price on request' : rate);
  if (product.sku) bits.push(product.sku);
  const photos = product.images.length;
  bits.push(photos === 1 ? '1 photo' : `${photos} photos`);
  return bits.join(' · ');
}

export function joinLabelList(labels: readonly string[]): string {
  return labels
    .map((label) => label.trim())
    .filter(Boolean)
    .join(' · ');
}

function formatAuditDate(when: string): string {
  return new Date(when).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
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
  const date = formatAuditDate(when);
  return who ? `${who} · ${date}` : date;
}

/** You library / own editor — date only (sr 23 / 34 / 36). */
export function libraryAuditLine(input: {
  createdAt: string;
  updatedAt?: string;
}): string | null {
  const when = input.updatedAt || input.createdAt;
  if (!when) return null;
  return formatAuditDate(when);
}
