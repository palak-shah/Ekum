import type { ExploreProductPreviewView } from '@ekum/domain-types';
import type { BrowseShortlistEntry } from './browseShortlist';

export function designSetToShortlist(product: ExploreProductPreviewView): BrowseShortlistEntry {
  return {
    productId: product.id,
    name: product.name,
    thumbUrl: product.images[0] ?? null,
    companyId: product.company.id,
    companyName: product.company.name,
    allowForward: product.allowForward,
    unit: product.unit ?? null,
    rate: product.rate ?? null,
  };
}

export function designSetOpenIds(
  tiles: readonly { id: string; status: 'ok' | 'locked' | 'missing' }[],
): string[] {
  return tiles.filter((tile) => tile.status === 'ok').map((tile) => tile.id);
}
