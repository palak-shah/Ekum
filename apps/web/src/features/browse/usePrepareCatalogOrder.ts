import { useCallback, useState } from 'react';
import { ApiError } from '@/lib/apiClient';
import { useToast } from '@/ui/Toast';
import type { BrowseAlbumEntry } from './browseAlbumPick';
import type { BrowseShortlistEntry } from './browseShortlist';
import {
  CATALOG_WHOLE_SELECT_TOAST,
  expandWholeCatalogsInShortlist,
  fetchCollectionOrderPreview,
  needsOrderResolveChoice,
  resolveCatalogOrderAlbums,
  type CatalogOrderResolveResult,
} from './catalogWholeOrder';

export type PreparedCatalogOrder =
  | { kind: 'resolve'; shortlist: BrowseShortlistEntry[]; lockedProductIds: string[] }
  | ({ kind: 'qty' } & CatalogOrderResolveResult)
  | ({ kind: 'navigate' } & CatalogOrderResolveResult)
  | { kind: 'error' };

export function usePrepareCatalogOrder() {
  const { showToast } = useToast();
  const [preparing, setPreparing] = useState(false);

  const prepare = useCallback(
    async (input: {
      albums: BrowseAlbumEntry[];
      shortlist: BrowseShortlistEntry[];
      /** DesignSheet Order already means the catalog — skip the remap toast. */
      quiet?: boolean;
    }): Promise<PreparedCatalogOrder> => {
      setPreparing(true);
      try {
        const exclusive = await expandWholeCatalogsInShortlist(
          input.shortlist,
          fetchCollectionOrderPreview,
        );
        const before = new Set(input.shortlist.map((entry) => entry.productId));
        if (
          !input.quiet &&
          exclusive.shortlist.some((entry) => !before.has(entry.productId))
        ) {
          showToast(CATALOG_WHOLE_SELECT_TOAST);
        }
        if (input.albums.length === 0) {
          return {
            kind: 'qty',
            shortlist: exclusive.shortlist,
            remainingAlbums: [],
            navigateToCollectionId: null,
            expandedAlbumNames: [],
            lockedProductIds: exclusive.lockedProductIds,
          };
        }
        if (needsOrderResolveChoice(input.albums)) {
          return {
            kind: 'resolve',
            shortlist: exclusive.shortlist,
            lockedProductIds: exclusive.lockedProductIds,
          };
        }
        const result = await resolveCatalogOrderAlbums({
          albums: input.albums,
          existingShortlist: exclusive.shortlist,
          emptyMessage: 'Pick at least one design to order.',
          fetchPreview: fetchCollectionOrderPreview,
        });
        const lockedProductIds = [
          ...new Set([...exclusive.lockedProductIds, ...result.lockedProductIds]),
        ];
        if (result.navigateToCollectionId) {
          return { kind: 'navigate', ...result, lockedProductIds };
        }
        return { kind: 'qty', ...result, lockedProductIds };
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Could not open those collections.';
        showToast(message, 'danger');
        return { kind: 'error' };
      } finally {
        setPreparing(false);
      }
    },
    [showToast],
  );

  return { prepare, preparing };
}
