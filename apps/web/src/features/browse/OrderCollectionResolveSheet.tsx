import { useEffect, useMemo, useRef, useState } from 'react';
import type { CollectionPreviewView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { Button, InlineNotice, Sheet, cx } from '@/ui/kit';
import { useToast } from '@/ui/Toast';
import type { BrowseAlbumEntry } from './browseAlbumPick';
import type { BrowseShortlistEntry } from './browseShortlist';
import {
  curateResolveSummary,
  mergeShortlistWithProducts,
  orderResolveSummary,
  type OrderAlbumChoice,
} from './albumSelectModel';
import {
  isWholeCatalogOrder,
  productToOrderShortlistEntry,
  resolveCatalogOrderAlbums,
} from './catalogWholeOrder';
import { canRelistFlag } from './forwardGate';

export type CollectionResolveIntent = 'order' | 'curate';

const RESOLVE_COPY = {
  order: {
    title: 'Order collections',
    prompt: 'How would you like to order this collection?',
    allTitle: 'All designs',
    allHint: 'Select all designs in this collection',
    chooseTitle: 'Choose designs',
    chooseHint: 'Open the collection and select specific designs',
    emptyMessage: 'Pick at least one design to order.',
    wholeHint: 'This catalog is ordered as a whole.',
  },
  curate: {
    title: 'Repost from collections',
    prompt: 'How would you like to repost this collection?',
    allTitle: 'Use whole collection',
    allHint: 'Add every design from this collection to your Repost',
    chooseTitle: 'Pick designs',
    chooseHint: 'Open the collection and select specific designs',
    emptyMessage: 'Pick at least one design to repost.',
    wholeHint: 'This catalog is ordered as a whole.',
  },
} as const;

export type CollectionResolveResult = {
  shortlist: BrowseShortlistEntry[];
  remainingAlbums: BrowseAlbumEntry[];
  navigateToCollectionId: string | null;
  /** Albums expanded with "all" / Use whole pack this turn. */
  expandedAlbumNames: string[];
  lockedProductIds?: string[];
};

function fetchPreview(collectionId: string) {
  return api.get<CollectionPreviewView>(`/explore/collections/${collectionId}`);
}

/**
 * After Order or Curate on a pick that includes collections: expand whole pack
 * or navigate to pick designs per album.
 */
export function OrderCollectionResolveSheet({
  open,
  onClose,
  albums,
  designCount,
  existingShortlist,
  onResolved,
  intent = 'order',
}: {
  open: boolean;
  onClose: () => void;
  albums: BrowseAlbumEntry[];
  designCount: number;
  existingShortlist: BrowseShortlistEntry[];
  onResolved: (result: CollectionResolveResult) => void;
  intent?: CollectionResolveIntent;
}) {
  const copy = RESOLVE_COPY[intent];
  const { showToast } = useToast();
  /** Curate never expands or opens pack-locked albums. */
  const resolveAlbums = useMemo(
    () =>
      intent === 'curate' ? albums.filter((album) => canRelistFlag(album.allowForward)) : albums,
    [intent, albums],
  );
  const [choices, setChoices] = useState<Record<string, OrderAlbumChoice>>({});
  const [wholeById, setWholeById] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoExpanding = useRef(false);

  const albumIsWhole = (album: BrowseAlbumEntry) =>
    wholeById[album.collectionId] === true || isWholeCatalogOrder(album);

  useEffect(() => {
    if (!open) return;
    const next: Record<string, OrderAlbumChoice> = {};
    for (const album of resolveAlbums) {
      next[album.collectionId] = 'all';
    }
    setChoices(next);
    setError(null);
    setBusy(false);
    autoExpanding.current = false;
    // Only when the sheet opens — a new albums array every parent render
    // must not wipe Continue errors or cancel Preparing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || intent !== 'order' || resolveAlbums.length === 0) return;
    let cancelled = false;
    void (async () => {
      const rows = await Promise.all(
        resolveAlbums.map(async (album) => {
          if (isWholeCatalogOrder(album)) return [album.collectionId, true] as const;
          try {
            const preview = await fetchPreview(album.collectionId);
            return [album.collectionId, isWholeCatalogOrder(preview)] as const;
          } catch {
            return [album.collectionId, false] as const;
          }
        }),
      );
      if (cancelled) return;
      setWholeById(Object.fromEntries(rows));
    })();
    return () => {
      cancelled = true;
    };
  }, [open, intent, resolveAlbums]);

  const setChoice = (collectionId: string, choice: OrderAlbumChoice) => {
    setChoices((prev) => ({ ...prev, [collectionId]: choice }));
  };

  const continueResolve = async () => {
    setBusy(true);
    setError(null);
    try {
      if (intent === 'order') {
        const result = await resolveCatalogOrderAlbums({
          albums: resolveAlbums,
          existingShortlist,
          choices,
          emptyMessage: copy.emptyMessage,
          fetchPreview,
        });
        onResolved(result);
        return;
      }

      let shortlist = existingShortlist;
      const remainingAlbums: BrowseAlbumEntry[] = [];
      let navigateToCollectionId: string | null = null;
      const expandedAlbumNames: string[] = [];

      for (const album of resolveAlbums) {
        const choice = choices[album.collectionId] ?? 'all';
        if (choice === 'choose') {
          if (!navigateToCollectionId) navigateToCollectionId = album.collectionId;
          else remainingAlbums.push(album);
          continue;
        }

        const preview = await fetchPreview(album.collectionId);
        const products = preview.products;
        if (products == null) {
          if (!navigateToCollectionId) navigateToCollectionId = album.collectionId;
          else remainingAlbums.push(album);
          continue;
        }
        if (products.length === 0) {
          throw new ApiError({
            statusCode: 400,
            code: 'COLLECTION_EMPTY',
            message: `${album.name} has no designs.`,
            details: null,
          });
        }
        const incoming = products.map((product) =>
          productToOrderShortlistEntry(
            product,
            {
              id: album.companyId,
              name: album.companyName,
            },
            {
              collectionId: album.collectionId,
              path: 'handle',
              allowForward: album.allowForward,
            },
          ),
        );
        shortlist = mergeShortlistWithProducts(shortlist, incoming);
        expandedAlbumNames.push(album.name);
      }

      if (shortlist.length === 0 && !navigateToCollectionId) {
        throw new ApiError({
          statusCode: 400,
          code: 'NO_DESIGNS',
          message: copy.emptyMessage,
          details: null,
        });
      }

      onResolved({ shortlist, remainingAlbums, navigateToCollectionId, expandedAlbumNames });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not open those collections.';
      setError(message);
      showToast(message, 'danger');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!open || intent !== 'order' || busy || autoExpanding.current) return;
    if (resolveAlbums.length === 0) return;
    const known = resolveAlbums.every(
      (album) => isWholeCatalogOrder(album) || wholeById[album.collectionId] === true,
    );
    if (!known) return;
    autoExpanding.current = true;
    void continueResolve();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-expand once when every album is whole
  }, [open, intent, wholeById, resolveAlbums, busy]);

  const summary =
    intent === 'curate'
      ? curateResolveSummary(designCount, resolveAlbums.length)
      : orderResolveSummary(designCount, resolveAlbums.length);

  return (
    <Sheet
      open={open}
      onClose={() => !busy && onClose()}
      title={copy.title}
      footer={
        <Button
          fullWidth
          disabled={busy || resolveAlbums.length === 0}
          onClick={() => void continueResolve()}
        >
          {busy ? 'Preparing…' : 'Continue'}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pb-1" data-testid="collection-resolve-sheet">
        <p className="text-name leading-relaxed text-muted">{summary}</p>
        {error ? <InlineNotice message={error} /> : null}
        {resolveAlbums.map((album) => {
          const choice = choices[album.collectionId] ?? 'all';
          const whole = intent === 'order' && albumIsWhole(album);
          return (
            <div
              key={album.collectionId}
              className="flex flex-col gap-2.5 rounded-xl border border-line bg-canvas/60 p-3"
            >
              <div className="flex flex-col gap-0.5">
                <p className="text-name font-emphasis tracking-tight text-ink">{album.name}</p>
                <p className="text-meta leading-snug text-muted">
                  {whole ? copy.wholeHint : copy.prompt}
                </p>
              </div>
              {whole ? null : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setChoice(album.collectionId, 'all')}
                    data-testid="resolve-use-whole-pack"
                    className={cx(
                      'rounded-xl border px-3.5 py-2.5 text-left transition-colors',
                      choice === 'all'
                        ? 'border-accent bg-foam text-ink'
                        : 'border-line bg-surface text-ink hover:bg-canvas',
                    )}
                  >
                    <span className="block text-name font-emphasis tracking-tight">
                      {copy.allTitle}
                    </span>
                    <span className="mt-0.5 block text-meta font-body leading-snug text-muted">
                      {copy.allHint}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChoice(album.collectionId, 'choose')}
                    data-testid="resolve-pick-designs"
                    className={cx(
                      'rounded-xl border px-3.5 py-2.5 text-left transition-colors',
                      choice === 'choose'
                        ? 'border-accent bg-foam text-ink'
                        : 'border-line bg-surface text-ink hover:bg-canvas',
                    )}
                  >
                    <span className="block text-name font-emphasis tracking-tight">
                      {copy.chooseTitle}
                    </span>
                    <span className="mt-0.5 block text-meta font-body leading-snug text-muted">
                      {copy.chooseHint}
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
