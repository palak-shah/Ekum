import { useCallback, useState } from 'react';
import { ApiError } from '@/lib/apiClient';
import { useToast } from '@/ui/Toast';
import type { BrowseAlbumEntry } from './browseAlbumPick';
import type { BrowseShortlistEntry } from './browseShortlist';
import {
  fetchCollectionOrderPreview,
  resolveCatalogOrderAlbums,
  type CatalogOrderResolveResult,
} from './catalogWholeOrder';
import {
  curateLockedSkipMessage,
  partitionRelistableAlbums,
} from './curateAlbumResolve';

export type PreparedCatalogCurate =
  | ({ kind: 'curate' } & CatalogOrderResolveResult)
  | ({ kind: 'navigate' } & CatalogOrderResolveResult)
  | { kind: 'empty' }
  | { kind: 'error' };

/**
 * Repost with albums: skip Use whole / Pick designs — expand all like Order.
 */
export function usePrepareCatalogCurate() {
  const { showToast } = useToast();
  const [preparing, setPreparing] = useState(false);

  const prepare = useCallback(
    async (input: {
      albums: BrowseAlbumEntry[];
      shortlist: BrowseShortlistEntry[];
    }): Promise<PreparedCatalogCurate> => {
      setPreparing(true);
      try {
        const { allowed: packAlbums, locked: lockedAlbums } = partitionRelistableAlbums(
          input.albums,
        );
        if (lockedAlbums.length > 0) {
          showToast(curateLockedSkipMessage(lockedAlbums.length));
        }
        if (packAlbums.length === 0) {
          if (input.shortlist.length < 1) return { kind: 'empty' };
          return {
            kind: 'curate',
            shortlist: input.shortlist,
            remainingAlbums: lockedAlbums,
            navigateToCollectionId: null,
            expandedAlbumNames: [],
            lockedProductIds: [],
          };
        }
        const result = await resolveCatalogOrderAlbums({
          albums: packAlbums,
          existingShortlist: input.shortlist,
          emptyMessage: 'Pick at least one design.',
          fetchPreview: fetchCollectionOrderPreview,
        });
        if (result.navigateToCollectionId) {
          return {
            kind: 'navigate',
            ...result,
            remainingAlbums: [...lockedAlbums, ...result.remainingAlbums],
          };
        }
        if (result.shortlist.length < 1) return { kind: 'empty' };
        return {
          kind: 'curate',
          ...result,
          remainingAlbums: [...lockedAlbums, ...result.remainingAlbums],
        };
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
