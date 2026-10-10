import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { BrowseAlbumEntry } from './browseAlbumPick';
import type { BrowseShortlistEntry } from './browseShortlist';
import {
  clearBrowseCart,
  readCartAlbums,
  readCartDesigns,
  removeCartAlbumIds,
  removeCartDesignIds,
  subscribeBrowseCart,
  writeCartAlbums,
  writeCartDesigns,
} from './browseCart';

export function useBrowseCart() {
  const designs = useSyncExternalStore(subscribeBrowseCart, readCartDesigns, () => [] as BrowseShortlistEntry[]);
  const albums = useSyncExternalStore(subscribeBrowseCart, readCartAlbums, () => [] as BrowseAlbumEntry[]);

  const productIds = useMemo(() => new Set(designs.map((entry) => entry.productId)), [designs]);
  const collectionIds = useMemo(
    () => new Set(albums.map((entry) => entry.collectionId)),
    [albums],
  );

  const removeDesignIds = useCallback((ids: string[]) => removeCartDesignIds(ids), []);
  const removeAlbumIds = useCallback((ids: string[]) => removeCartAlbumIds(ids), []);
  const clear = useCallback(() => clearBrowseCart(), []);
  const replaceDesigns = useCallback((entries: BrowseShortlistEntry[]) => writeCartDesigns(entries), []);
  const replaceAlbums = useCallback((entries: BrowseAlbumEntry[]) => writeCartAlbums(entries), []);

  return {
    designs,
    albums,
    productIds,
    collectionIds,
    designCount: designs.length,
    albumCount: albums.length,
    count: designs.length + albums.length,
    removeDesignIds,
    removeAlbumIds,
    clear,
    replaceDesigns,
    replaceAlbums,
  };
}
