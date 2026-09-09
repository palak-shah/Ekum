import { useEffect, useMemo, useState } from 'react';
import type { CollectionPreviewView, ProductView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { Button, InlineNotice, Sheet, cx } from '@/ui/kit';
import type { BrowseAlbumEntry } from './browseAlbumPick';
import type { BrowseShortlistEntry } from './browseShortlist';
import {
  curateResolveSummary,
  mergeShortlistWithProducts,
  orderResolveSummary,
  type OrderAlbumChoice,
} from './albumSelectModel';
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
  },
  curate: {
    title: 'Curate from collections',
    prompt: 'How would you like to curate this collection?',
    allTitle: 'Use whole pack',
    allHint: 'Put every design from this pack into your Curate set',
    chooseTitle: 'Pick designs',
    chooseHint: 'Open the collection and select specific designs',
    emptyMessage: 'Pick at least one design to curate.',
  },
} as const;

function productToShortlistEntry(
  product: ProductView,
  fallbackCompany: { id: string; name: string },
  pack?: { collectionId: string; path: string | null; allowForward?: boolean },
): BrowseShortlistEntry {
  const path = pack?.path === 'handle' || pack?.path === 'direct' ? pack.path : undefined;
  return {
    productId: product.id,
    name: product.name?.trim() || 'Design',
    thumbUrl: product.images?.[0] ?? null,
    companyId: product.companyId || fallbackCompany.id,
    companyName: product.companyName?.trim() || fallbackCompany.name,
    allowForward: product.allowForward,
    ...(pack
      ? {
          sourceCollectionId: pack.collectionId,
          sourceHandlerName: fallbackCompany.name,
          sourcePath: path,
          sourcePackAllowForward: pack.allowForward !== false,
        }
      : {}),
  };
}

export type CollectionResolveResult = {
  shortlist: BrowseShortlistEntry[];
  remainingAlbums: BrowseAlbumEntry[];
  navigateToCollectionId: string | null;
  /** Albums expanded with "all" / Use whole pack this turn. */
  expandedAlbumNames: string[];
};

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
  /** Curate never expands or opens pack-locked albums. */
  const resolveAlbums = useMemo(
    () =>
      intent === 'curate' ? albums.filter((album) => canRelistFlag(album.allowForward)) : albums,
    [intent, albums],
  );
  const [choices, setChoices] = useState<Record<string, OrderAlbumChoice>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const next: Record<string, OrderAlbumChoice> = {};
    for (const album of resolveAlbums) {
      next[album.collectionId] = 'all';
    }
    setChoices(next);
    setError(null);
    setBusy(false);
  }, [open, resolveAlbums]);

  const setChoice = (collectionId: string, choice: OrderAlbumChoice) => {
    setChoices((prev) => ({ ...prev, [collectionId]: choice }));
  };

  const continueResolve = async () => {
    setBusy(true);
    setError(null);
    try {
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

        const preview = await api.get<CollectionPreviewView>(
          `/explore/collections/${album.collectionId}`,
        );
        const products = preview.products;
        if (!products || products.length === 0) {
          throw new ApiError({
            statusCode: 400,
            code: 'COLLECTION_EMPTY',
            message: `Open ${album.name} to pick designs — designs aren’t listed here yet.`,
            details: null,
          });
        }
        const incoming = products.map((product) =>
          productToShortlistEntry(
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
      setError(err instanceof ApiError ? err.message : 'Could not open those collections.');
    } finally {
      setBusy(false);
    }
  };

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
      <div className="flex flex-col gap-4" data-testid="collection-resolve-sheet">
        <p className="text-sm text-muted">{summary}</p>
        {resolveAlbums.map((album) => {
          const choice = choices[album.collectionId] ?? 'all';
          return (
            <div key={album.collectionId} className="rounded-2xl border border-line p-3">
              <p className="mb-2 text-sm font-semibold text-ink">{album.name}</p>
              <p className="mb-3 text-xs text-muted">{copy.prompt}</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setChoice(album.collectionId, 'all')}
                  data-testid="resolve-use-whole-pack"
                  className={cx(
                    'rounded-xl border px-3 py-2.5 text-left text-sm font-medium',
                    choice === 'all'
                      ? 'border-accent bg-accent/5 text-ink'
                      : 'border-line bg-surface text-ink',
                  )}
                >
                  <span className="font-semibold">{copy.allTitle}</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted">{copy.allHint}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChoice(album.collectionId, 'choose')}
                  data-testid="resolve-pick-designs"
                  className={cx(
                    'rounded-xl border px-3 py-2.5 text-left text-sm font-medium',
                    choice === 'choose'
                      ? 'border-accent bg-accent/5 text-ink'
                      : 'border-line bg-surface text-ink',
                  )}
                >
                  <span className="font-semibold">{copy.chooseTitle}</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted">{copy.chooseHint}</span>
                </button>
              </div>
            </div>
          );
        })}
        {error ? <InlineNotice message={error} /> : null}
      </div>
    </Sheet>
  );
}
