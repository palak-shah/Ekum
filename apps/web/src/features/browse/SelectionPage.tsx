import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SavedItemView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useTradePresence } from '@/lib/tradePresence';
import { pickSelectionLabel, shouldShowAlbumSelectActions } from '@/features/browse/albumSelectModel';
import { clearSelection } from '@/features/browse/clearSelection';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { CurateFromSelectionSheet } from '@/features/browse/CurateFromSelectionSheet';
import { OrderCollectionResolveSheet } from '@/features/browse/OrderCollectionResolveSheet';
import {
  writeBrowseAlbumPick,
  type BrowseAlbumEntry,
} from '@/features/browse/browseAlbumPick';
import {
  writeBrowseShortlist,
  type BrowseShortlistEntry,
} from '@/features/browse/browseShortlist';
import { RELIST_LOCKED_TOAST } from '@/features/browse/forwardGate';
import {
  curateDefaultPackName,
  curateLockedSkipMessage,
  packLockReason,
  partitionRelistableAlbums,
  partitionRelistableDesigns,
} from '@/features/browse/curateAlbumResolve';
import {
  clearResumeAfterAlbumPick,
  writeResumeAfterAlbumPick,
} from '@/features/browse/resumeAfterAlbumPick';
import {
  resolveSelectionAvailability,
  type SelectionAvailability,
} from '@/features/browse/selectionAvailability';
import { useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { packHandlerName } from '@/features/browse/packOrderSource';
import { entriesAsProducts, useShortlistOrderFlow } from '@/features/browse/useShortlistOrderFlow';
import { BatchOrderConfirmSheet } from '@/features/orders/BatchOrderConfirmSheet';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import { SAVED_QUERY_KEY } from '@/features/saved/useSaveToggle';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { Button, EmptyState, LoadingBlock, cx } from '@/ui/kit';

type DesignRow = BrowseShortlistEntry & { availability?: SelectionAvailability };
type AlbumRow = BrowseAlbumEntry & { availability?: SelectionAvailability };

type SelectionNavState = {
  openCurate?: boolean;
  openOrder?: boolean;
};

export function SelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { trading } = useTradePresence();
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const orderFlow = useShortlistOrderFlow();
  const [curateOpen, setCurateOpen] = useState(false);
  const [curateProductIds, setCurateProductIds] = useState<string[] | undefined>(undefined);
  const [curateDefaultName, setCurateDefaultName] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [orderResolveOpen, setOrderResolveOpen] = useState(false);
  const [curateResolveOpen, setCurateResolveOpen] = useState(false);
  const [savingPick, setSavingPick] = useState(false);

  const total = shortlist.count + albumPick.count;
  const availabilityKey = useMemo(
    () =>
      [
        ...shortlist.entries.map((e) => e.productId),
        ...albumPick.entries.map((e) => e.collectionId),
      ].join('|'),
    [shortlist.entries, albumPick.entries],
  );

  const availability = useQuery({
    queryKey: ['selection-availability', availabilityKey],
    queryFn: () =>
      resolveSelectionAvailability({
        designs: shortlist.entries,
        albums: albumPick.entries,
      }),
    enabled: total > 0,
  });

  const designRows: DesignRow[] = shortlist.entries.map((entry) => ({
    ...entry,
    availability: availability.data?.designs.get(entry.productId),
  }));
  const albumRows: AlbumRow[] = albumPick.entries.map((entry) => ({
    ...entry,
    availability: availability.data?.albums.get(entry.collectionId),
  }));

  const availableDesigns = designRows.filter((row) => row.availability?.available !== false);
  const availableAlbums = albumRows.filter((row) => row.availability?.available !== false);
  const unavailableCount =
    designRows.filter((row) => row.availability?.available === false).length +
    albumRows.filter((row) => row.availability?.available === false).length;

  // While resolving, treat unknown as available so verbs aren't flash-disabled.
  const resolving = availability.isLoading || availability.isFetching;
  /** Pack-locked albums stay on the list but never enter Curate resolve / Pick designs. */
  const curatableAlbums = useMemo(() => {
    const source = resolving ? albumPick.entries : availableAlbums;
    return partitionRelistableAlbums(source).allowed;
  }, [resolving, albumPick.entries, availableAlbums]);
  const availableDesignCount = resolving ? shortlist.count : availableDesigns.length;
  const availableAlbumCount = resolving ? albumPick.count : availableAlbums.length;
  const availableTotal = availableDesignCount + availableAlbumCount;

  const shown = shouldShowAlbumSelectActions({
    designCount: availableDesignCount,
    albumCount: availableAlbumCount,
    trading,
  });

  const toastSkippedUnavailable = () => {
    if (unavailableCount < 1 || resolving) return;
    showToast(
      unavailableCount === 1
        ? '1 item isn’t available and was left out.'
        : `${unavailableCount} items aren’t available and were left out.`,
    );
  };

  const onClear = () => {
    clearSelection();
  };

  const onOrder = () => {
    if (availableTotal < 1) return;
    toastSkippedUnavailable();
    orderFlow.setError(null);
    if (availableAlbumCount > 0) {
      setOrderResolveOpen(true);
      return;
    }
    orderFlow.setQtyOpen(true);
  };

  const openCurateWithDesigns = (
    source: BrowseShortlistEntry[],
    expandedAlbumNames: string[] = [],
  ) => {
    const { allowed, locked } = partitionRelistableDesigns(source);
    if (allowed.length === 0) {
      showToast(
        source.length === 0 ? 'Pick at least one design.' : RELIST_LOCKED_TOAST,
        'danger',
      );
      return;
    }
    if (locked.length > 0) {
      showToast(curateLockedSkipMessage(locked.length));
    }
    setCurateDefaultName(
      curateDefaultPackName({
        expandedAlbumNames,
        allowedDesignNames: allowed.map((entry) => entry.name),
      }),
    );
    setCurateProductIds(allowed.map((entry) => entry.productId));
    setCurateOpen(true);
  };

  const onCurate = () => {
    if (availableTotal < 1) return;
    toastSkippedUnavailable();
    const albums = resolving ? albumPick.entries : availableAlbums;
    const designs = resolving ? shortlist.entries : availableDesigns;
    const { allowed: packAlbums, locked: lockedAlbums } = partitionRelistableAlbums(albums);
    if (lockedAlbums.length > 0) {
      showToast(curateLockedSkipMessage(lockedAlbums.length));
    }
    if (packAlbums.length > 0) {
      setCurateResolveOpen(true);
      return;
    }
    openCurateWithDesigns(designs, []);
  };

  /** After Pick designs → Continue: reopen Curate/Order without another Selection tap. */
  useEffect(() => {
    const state = (location.state as SelectionNavState | null) ?? {};
    if (!state.openCurate && !state.openOrder) return;
    navigate(location.pathname + location.search, { replace: true, state: {} });
    clearResumeAfterAlbumPick();
    if (state.openCurate) {
      const { allowed: packAlbums } = partitionRelistableAlbums(albumPick.entries);
      if (packAlbums.length > 0) setCurateResolveOpen(true);
      else if (shortlist.count > 0) openCurateWithDesigns(shortlist.entries, []);
      return;
    }
    if (state.openOrder) {
      orderFlow.setError(null);
      if (albumPick.count > 0) setOrderResolveOpen(true);
      else if (shortlist.count > 0) orderFlow.setQtyOpen(true);
    }
    // Intentionally once per nav state — not when shortlist/album counts change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resume handoff
  }, [location.state]);

  const onBookmark = async () => {
    if (availableTotal < 1) return;
    toastSkippedUnavailable();
    setSavingPick(true);
    try {
      let saved = 0;
      const albums = resolving ? albumPick.entries : availableAlbums;
      const designs = resolving ? shortlist.entries : availableDesigns;
      for (const entry of albums) {
        await api.post<SavedItemView>('/saved', { collectionId: entry.collectionId });
        saved += 1;
      }
      for (const entry of designs) {
        await api.post<SavedItemView>('/saved', { productId: entry.productId });
        saved += 1;
      }
      void queryClient.invalidateQueries({ queryKey: SAVED_QUERY_KEY });
      // Leave Selection before clear — otherwise "Nothing selected" fights the success toast.
      const savedTo =
        albums.length > 0 && designs.length === 0 ? '/saved?tab=collections' : '/saved';
      navigate(savedTo);
      clearSelection();
      showToast(saved === 1 ? 'Bookmarked' : `${saved} bookmarked`, 'success');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not bookmark.', 'danger');
    } finally {
      setSavingPick(false);
    }
  };

  return (
    <div className={cx('flex flex-col gap-3', total > 0 && 'pb-[calc(5rem+7.5rem)]')}>
      <PageHeader title="Your selection" />

      {total < 1 ? (
        <EmptyState
          title="Nothing selected"
          message="Long-press on Explore, Saved, or a company shop — or on My designs use To selection (published only) — then Order, Curate, Bookmark, or Share here."
          action={
            <Button variant="secondary" onClick={() => navigate('/explore')}>
              Open Explore
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-sm font-semibold text-ink" data-testid="selection-count-label">
            {pickSelectionLabel(albumPick.count, shortlist.count)}
          </p>

          {availability.isLoading ? <LoadingBlock label="Checking availability…" /> : null}

          <ul className="flex flex-col gap-2" data-testid="selection-list">
            {albumRows.map((row) => {
              const discoveryUnavailable = row.availability?.available === false;
              const packReason = packLockReason(row.allowForward);
              return (
                <SelectionRow
                  key={`c-${row.collectionId}`}
                  kind="Collection"
                  name={row.name}
                  companyName={row.companyName}
                  thumbUrl={row.coverImage}
                  unavailable={discoveryUnavailable}
                  packLocked={Boolean(packReason) && !discoveryUnavailable}
                  reason={row.availability?.reason ?? packReason}
                  onRemove={() => albumPick.removeIds([row.collectionId])}
                />
              );
            })}
            {designRows.map((row) => {
              const discoveryUnavailable = row.availability?.available === false;
              const packReason = packLockReason(row.allowForward);
              return (
                <SelectionRow
                  key={`p-${row.productId}`}
                  kind="Design"
                  name={row.name}
                  companyName={row.companyName}
                  thumbUrl={row.thumbUrl}
                  unavailable={discoveryUnavailable}
                  packLocked={Boolean(packReason) && !discoveryUnavailable}
                  reason={row.availability?.reason ?? packReason}
                  onRemove={() => shortlist.removeIds([row.productId])}
                />
              );
            })}
          </ul>

          {typeof document !== 'undefined' ? (
            <div className="fixed inset-x-0 bottom-[4.75rem] z-30 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-md">
              <div className="mx-auto flex max-w-md flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted">
                    {availableTotal < 1 && !resolving
                      ? 'Nothing available to act on'
                      : 'Order · Curate · Bookmark · Share'}
                  </p>
                  <button
                    type="button"
                    className="text-xs font-bold text-accent"
                    onClick={onClear}
                    data-testid="selection-clear"
                  >
                    Clear selection
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {shown.order ? (
                    <Button
                      className="min-w-0 flex-1"
                      disabled={availableTotal < 1 || savingPick}
                      onClick={onOrder}
                      data-testid="selection-order"
                    >
                      Order
                    </Button>
                  ) : null}
                  {shown.curate ? (
                    <Button
                      variant="secondary"
                      className="min-w-0 flex-1"
                      disabled={availableTotal < 1 || savingPick}
                      onClick={onCurate}
                      data-testid="selection-curate"
                    >
                      Curate
                    </Button>
                  ) : null}
                  {shown.bookmark ? (
                    <Button
                      variant="secondary"
                      className="min-w-0 flex-1"
                      disabled={availableTotal < 1 || savingPick}
                      onClick={() => void onBookmark()}
                      data-testid="selection-bookmark"
                    >
                      {savingPick ? 'Bookmarking…' : 'Bookmark'}
                    </Button>
                  ) : null}
                  {shown.share ? (
                    <Button
                      variant="secondary"
                      className="min-w-0 flex-1"
                      disabled={availableTotal < 1 || savingPick}
                      onClick={() => {
                        toastSkippedUnavailable();
                        setShareOpen(true);
                      }}
                      data-testid="selection-share"
                    >
                      Share
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      <OrderCollectionResolveSheet
        intent="order"
        open={orderResolveOpen}
        onClose={() => setOrderResolveOpen(false)}
        albums={resolving ? albumPick.entries : availableAlbums}
        designCount={availableDesignCount}
        existingShortlist={resolving ? shortlist.entries : availableDesigns}
        onResolved={({ shortlist: nextShortlist, remainingAlbums, navigateToCollectionId }) => {
          const unavailableAlbums = albumPick.entries.filter(
            (entry) => availability.data?.albums.get(entry.collectionId)?.available === false,
          );
          const unavailableDesigns = shortlist.entries.filter(
            (entry) => availability.data?.designs.get(entry.productId)?.available === false,
          );
          writeBrowseShortlist([...unavailableDesigns, ...nextShortlist]);
          writeBrowseAlbumPick([...unavailableAlbums, ...remainingAlbums]);
          setOrderResolveOpen(false);
          if (navigateToCollectionId) {
            writeResumeAfterAlbumPick('order');
            navigate(`/collections/${navigateToCollectionId}`, {
              state: { enterSelect: true },
            });
            return;
          }
          clearResumeAfterAlbumPick();
          orderFlow.setQtyOpen(true);
        }}
      />
      <OrderCollectionResolveSheet
        intent="curate"
        open={curateResolveOpen}
        onClose={() => setCurateResolveOpen(false)}
        albums={curatableAlbums}
        designCount={resolving ? shortlist.count : availableDesigns.length}
        existingShortlist={resolving ? shortlist.entries : availableDesigns}
        onResolved={({
          shortlist: nextShortlist,
          remainingAlbums,
          navigateToCollectionId,
          expandedAlbumNames,
        }) => {
          const unavailableAlbums = albumPick.entries.filter(
            (entry) => availability.data?.albums.get(entry.collectionId)?.available === false,
          );
          const unavailableDesigns = shortlist.entries.filter(
            (entry) => availability.data?.designs.get(entry.productId)?.available === false,
          );
          const lockedAlbums = partitionRelistableAlbums(albumPick.entries).locked;
          writeBrowseShortlist([...unavailableDesigns, ...nextShortlist]);
          const keptAlbums = new Map<string, BrowseAlbumEntry>();
          for (const entry of [...unavailableAlbums, ...lockedAlbums, ...remainingAlbums]) {
            keptAlbums.set(entry.collectionId, entry);
          }
          writeBrowseAlbumPick([...keptAlbums.values()]);
          setCurateResolveOpen(false);
          if (navigateToCollectionId) {
            writeResumeAfterAlbumPick('curate');
            navigate(`/collections/${navigateToCollectionId}`, {
              state: { enterSelect: true },
            });
            return;
          }
          clearResumeAfterAlbumPick();
          openCurateWithDesigns(nextShortlist, expandedAlbumNames);
        }}
      />
      <CatalogShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        collections={(resolving ? albumPick.entries : availableAlbums).map((entry) => ({
          collectionId: entry.collectionId,
          name: entry.name,
        }))}
        products={(resolving ? shortlist.entries : availableDesigns).map((entry) => ({
          productId: entry.productId,
          name: entry.name,
        }))}
        onShared={() => {
          clearSelection();
        }}
      />
      <HowManyEachSheet
        open={orderFlow.qtyOpen}
        onClose={() => orderFlow.setQtyOpen(false)}
        sellerId={
          availableDesigns.length === 0
            ? 'multi'
            : availableDesigns.length === 1
              ? availableDesigns[0]!.companyId
              : availableDesigns.every((entry) => entry.companyId === availableDesigns[0]?.companyId)
                ? availableDesigns[0]!.companyId
                : 'multi'
        }
        products={entriesAsProducts(resolving ? shortlist.entries : availableDesigns)}
        submitting={orderFlow.submitting}
        asking={orderFlow.asking}
        error={orderFlow.error}
        orderGoesToName={packHandlerName(resolving ? shortlist.entries : availableDesigns)}
        onSendOrder={orderFlow.sendOrder}
        onAskRates={orderFlow.askRates}
      />
      <BatchOrderConfirmSheet
        open={orderFlow.confirmOpen}
        result={orderFlow.result}
        onClose={() => orderFlow.setConfirmOpen(false)}
      />
      <CurateFromSelectionSheet
        open={curateOpen}
        onClose={() => {
          setCurateOpen(false);
          setCurateProductIds(undefined);
          setCurateDefaultName('');
        }}
        productIds={curateProductIds}
        defaultName={curateDefaultName}
        onCurated={() => clearSelection()}
      />
    </div>
  );
}

function SelectionRow({
  kind,
  name,
  companyName,
  thumbUrl,
  unavailable,
  packLocked,
  reason,
  onRemove,
}: {
  kind: string;
  name: string;
  companyName: string;
  thumbUrl: string | null;
  unavailable?: boolean;
  packLocked?: boolean;
  reason?: string;
  onRemove: () => void;
}) {
  const faded = Boolean(unavailable || packLocked);
  return (
    <li
      className={cx(
        'flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5',
        faded && 'opacity-45',
      )}
      data-unavailable={unavailable ? 'true' : undefined}
      data-pack-locked={packLocked ? 'true' : undefined}
    >
      {thumbUrl ? (
        <img src={thumbUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foam text-xs font-bold text-muted">
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className={cx('truncate text-sm font-semibold', faded ? 'text-muted' : 'text-ink')}>
          {name}
        </p>
        <p className="truncate text-xs text-muted">
          {kind} · {companyName}
          {faded && reason ? ` · ${reason}` : null}
        </p>
        {faded && reason ? (
          <p
            className="mt-0.5 text-xs font-medium text-danger"
            data-testid={unavailable ? 'selection-unavailable-reason' : 'selection-pack-lock-reason'}
          >
            {reason}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label={`Remove ${name}`}
        className="shrink-0 rounded-full px-2 py-1 text-lg leading-none text-muted hover:bg-foam hover:text-ink"
        onClick={onRemove}
      >
        ×
      </button>
    </li>
  );
}
