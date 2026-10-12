import { CollectionStatus } from '@ekum/domain-types';
import { collectionMosaicCount } from '@/ui/albumMosaic';

export type CollectionAlbumSurface = 'library' | 'shelf';

/** Open target + optional packManage for CollectionAlbumTile. */
export function collectionAlbumOpenTarget(input: {
  surface: CollectionAlbumSurface;
  id: string;
  status?: string;
  packManage?: boolean;
}): { href: string; state?: { packManage: true } } {
  if (input.surface === 'library' && input.status === CollectionStatus.Archived) {
    return { href: `/catalog/collections/${input.id}` };
  }
  const href = `/collections/${input.id}`;
  if (input.surface === 'library') {
    return { href, state: { packManage: true } };
  }
  if (input.packManage) {
    return { href, state: { packManage: true } };
  }
  return { href };
}

/** Mosaic imageCount — library may show +N from productCount; shelf never leaks inventory. */
export function collectionAlbumMosaicCount(input: {
  surface: CollectionAlbumSurface;
  productCount?: number;
  previewCount: number;
}): number {
  if (input.surface === 'shelf') return input.previewCount;
  return collectionMosaicCount({
    productCount: input.productCount ?? input.previewCount,
    previewCount: input.previewCount,
  });
}
