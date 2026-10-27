import type { BuyerGroupName } from './collectionStatusSummary';
import type { ProductView } from '@ekum/domain-types';
import { ProductStatus } from '@ekum/domain-types';

/** Draft / pack-only / archived only — not On Explore or who can see. */
export function productStatusLine(
  product: ProductView,
  _groups: BuyerGroupName[] = [],
): string {
  if (product.status === ProductStatus.Archived) {
    return 'Deleted';
  }
  if (product.status === ProductStatus.Draft) {
    return 'Draft';
  }
  /** Pack / catalog publish marks designs Published without a solo Explore tile. */
  if (!product.postedToMarketAt) {
    return product.catalogCollectionId ? 'In your catalog' : 'In your collections';
  }
  return '';
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
