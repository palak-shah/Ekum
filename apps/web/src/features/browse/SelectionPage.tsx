import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CollectionPreviewView,
  CurateCheckView,
  RelistAccessView,
  RelistRequestView,
  SavedItemView,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useTradePresence } from '@/lib/tradePresence';
import { useMyCompany } from '@/lib/queries';
import { pickSelectionLabel, shouldShowAlbumSelectActions } from '@/features/browse/albumSelectModel';
import { selectionRowHref } from '@/features/browse/selectionRowHref';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { CurateFromSelectionSheet } from '@/features/browse/CurateFromSelectionSheet';
import { OrderCollectionResolveSheet } from '@/features/browse/OrderCollectionResolveSheet';
import {
  clearBrowseCart,
  readCartAlbums,
  readCartDesigns,
  writeCartAlbums,
  writeCartDesigns,
} from '@/features/browse/browseCart';
import type { BrowseAlbumEntry } from '@/features/browse/browseAlbumPick';
import type { BrowseShortlistEntry } from '@/features/browse/browseShortlist';
import { useBrowseCart } from '@/features/browse/useBrowseCart';
import {
  CURATE_ASK_RELIST,
  curateAskAllLabel,
  mayAskToPutInPack,
  groupRelistAskBatches,
} from '@/features/browse/curateCheck';
import {
  curateDefaultPackName,
  curateLockedSkipMessage,
  packLockReason,
  partitionRelistableAlbums,
} from '@/features/browse/curateAlbumResolve';
import {
  clearResumeAfterAlbumPick,
  writeResumeAfterAlbumPick,
} from '@/features/browse/resumeAfterAlbumPick';
import {
  resolveSelectionAvailability,
  selectionListDesignChrome,
  type SelectionAvailability,
} from '@/features/browse/selectionAvailability';
import { addStagingToCart } from '@/features/browse/addStagingToCart';
import {
  collectionIdForPackOrder,
  packHandlerName,
} from '@/features/browse/packOrderSource';
import { entriesAsProducts, useShortlistOrderFlow } from '@/features/browse/useShortlistOrderFlow';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import { SAVED_QUERY_KEY } from '@/features/saved/useSaveToggle';
import { youSavedHref } from '@/features/saved/youSavedHref';
import { DockIconButton } from '@/features/browse/BottomTradeDock';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { BookmarkIcon, PaperPlaneIcon, RepostIcon } from '@/ui/icons';
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
  const me = useMyCompany();
  const myCompanyId = me.data?.id;
  const cart = useBrowseCart();
  const shortlist = {
    entries: cart.designs,
    count: cart.designCount,
    removeIds: cart.removeDesignIds,
  };
  const albumPick = {
    entries: cart.albums,
    count: cart.albumCount,
    removeIds: cart.removeAlbumIds,
  };
  const orderFlow = useShortlistOrderFlow();
  const [curateOpen, setCurateOpen] = useState(false);
  const [curateProductIds, setCurateProductIds] = useState<string[] | undefined>(undefined);
  const [curateDefaultName, setCurateDefaultName] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [orderResolveOpen, setOrderResolveOpen] = useState(false);
  const [curateResolveOpen, setCurateResolveOpen] = useState(false);
  const [qtyEntries, setQtyEntries] = useState<BrowseShortlistEntry[] | null>(null);
  const [savingPick, setSavingPick] = useState(false);
  const [askingKey, setAskingKey] = useState<string | null>(null);
  const [waitingAlbumIds, setWaitingAlbumIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!orderFlow.qtyOpen) setQtyEntries(null);
  }, [orderFlow.qtyOpen]);

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

  const designProductIds = useMemo(
    () => shortlist.entries.map((e) => e.productId),
    [shortlist.entries],
  );

  const curateCheck = useQuery({
    queryKey: ['collections', 'curate-check', designProductIds.join('|')],
    queryFn: () =>
      api.post<CurateCheckView>('/collections/curate-check', {
        productIds: designProductIds,
      }),
    enabled: trading && designProductIds.length > 0,
  });
  const curateBlockCodeById = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of curateCheck.data?.blocked ?? []) {
      map.set(row.productId, row.code);
    }
    return map;
  }, [curateCheck.data?.blocked]);

  const relistAccess = useQuery({
    queryKey: [
      'relist-access',
      designProductIds.join('|'),
      shortlist.entries
        .map((e) => `${e.productId}:${e.sourceCollectionId ?? ''}`)
        .join(','),
    ],
    queryFn: () => {
      const packByProductId: Record<string, string> = {};
      for (const entry of shortlist.entries) {
        if (entry.sourceCollectionId) {
          packByProductId[entry.productId] = entry.sourceCollectionId;
        }
      }
      return api.post<RelistAccessView>('/relist-requests/access', {
        productIds: designProductIds,
        packByProductId,
      });
    },
    enabled: designProductIds.length > 0,
    refetchOnWindowFocus: true,
  });

  const grantedIds = useMemo(
    () => new Set(relistAccess.data?.grantedProductIds ?? []),
    [relistAccess.data?.grantedProductIds],
  );
  const packOpenIds = useMemo(
    () => new Set(relistAccess.data?.packOpenProductIds ?? []),
    [relistAccess.data?.packOpenProductIds],
  );
  const pendingByProductId = relistAccess.data?.pendingByProductId ?? {};

  const askRelist = useMutation({
    mutationFn: (input: {
      productIds: string[];
      sourceCollectionId?: string;
      albumId?: string;
    }) =>
      api
        .post<RelistRequestView>('/relist-requests', {
          productIds: input.productIds,
          sourceCollectionId: input.sourceCollectionId,
        })
        .then((view) => ({ view, albumId: input.albumId })),
    onSuccess: ({ albumId }) => {
      if (albumId) {
        setWaitingAlbumIds((prev) => new Set(prev).add(albumId));
      }
      void queryClient.invalidateQueries({ queryKey: ['relist-access'] });
      setAskingKey(null);
    },
    onError: (err) => {
      setAskingKey(null);
      showToast(err instanceof ApiError ? err.message : 'Could not ask.', 'danger');
    },
  });

  const onAskDesign = (productId: string, sourceCollectionId?: string) => {
    setAskingKey(`p-${productId}`);
    askRelist.mutate({
      productIds: [productId],
      sourceCollectionId,
    });
  };

  const onAskAlbum = async (collectionId: string) => {
    setAskingKey(`c-${collectionId}`);
    try {
      const preview = await api.get<CollectionPreviewView>(
        `/explore/collections/${collectionId}`,
      );
      const lockedIds = (preview.products ?? [])
        .filter((p) => {
          if (grantedIds.has(p.id) || packOpenIds.has(p.id)) return false;
          if (preview.allowForward !== false) return false;
          return p.allowForward === false;
        })
        .map((p) => p.id);
      if (lockedIds.length < 1) {
        showToast('Nothing to ask for in this collection.');
        setAskingKey(null);
        return;
      }
      askRelist.mutate({
        productIds: lockedIds,
        sourceCollectionId: collectionId,
        albumId: collectionId,
      });
    } catch (err) {
      setAskingKey(null);
      showToast(err instanceof ApiError ? err.message : 'Could not ask.', 'danger');
    }
  };

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

  const lookOnlyCompanyIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of designRows) {
      if (curateBlockCodeById.get(row.productId) === 'FOLLOW_LOOK_ONLY') {
        ids.add(row.companyId);
      }
    }
    return ids;
  }, [designRows, curateBlockCodeById]);

  const packAskDesigns = designRows.filter((row) => {
    if (row.availability?.available === false) return false;
    const waiting = Boolean(pendingByProductId[row.productId]);
    const packLocked = Boolean(
      packLockReason(row.allowForward, {
        hasGrant: grantedIds.has(row.productId),
        waiting,
        sourcePackAllowForward:
          packOpenIds.has(row.productId) || row.sourcePackAllowForward === true,
      }),
    );
    return mayAskToPutInPack({
      trading,
      ownCompany: Boolean(myCompanyId) && row.companyId === myCompanyId,
      waiting,
      packLocked,
      lookOnly: lookOnlyCompanyIds.has(row.companyId),
    });
  });

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
    clearBrowseCart();
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
    if (source.length === 0) {
      showToast('Pick at least one design.');
      return;
    }
    setCurateDefaultName(
      curateDefaultPackName({
        expandedAlbumNames,
        allowedDesignNames: source.map((entry) => entry.name),
      }),
    );
    setCurateProductIds(source.map((entry) => entry.productId));
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
    // Resume pick-designs lands in staging — fold into cart before acting.
    addStagingToCart();
    const cartDesigns = readCartDesigns();
    const cartAlbums = readCartAlbums();
    if (state.openCurate) {
      const { allowed: packAlbums } = partitionRelistableAlbums(cartAlbums);
      if (packAlbums.length > 0) setCurateResolveOpen(true);
      else if (cartDesigns.length > 0) openCurateWithDesigns(cartDesigns, []);
      return;
    }
    if (state.openOrder) {
      orderFlow.setError(null);
      if (cartAlbums.length > 0) setOrderResolveOpen(true);
      else if (cartDesigns.length > 0) orderFlow.setQtyOpen(true);
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
        albums.length > 0 && designs.length === 0
          ? youSavedHref({ collections: true })
          : youSavedHref();
      navigate(savedTo);
      clearBrowseCart();
      showToast(saved === 1 ? 'Bookmarked' : `${saved} bookmarked`, 'success');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not bookmark.', 'danger');
    } finally {
      setSavingPick(false);
    }
  };

  return (
    <div
      className={cx(
        'flex flex-col gap-4',
        // Icons + Order + Clear cart (same band shape as Explore selecting dock).
        total > 0 && 'pb-[calc(9.5rem+env(safe-area-inset-bottom))]',
      )}
    >
      <PageHeader title="Cart" />

      {total < 1 ? (
        <EmptyState
          title="Cart is empty"
          message="On Explore, Select designs or collections, then tap Cart on the dock."
          action={
            <Button variant="secondary" onClick={() => navigate('/explore')}>
              Open Explore
            </Button>
          }
        />
      ) : (
        <>
          <p
            className="px-0.5 text-[15px] font-semibold tracking-tight text-ink"
            data-testid="selection-count-label"
          >
            {pickSelectionLabel(albumPick.count, shortlist.count)}
          </p>

          {availability.isLoading ? <LoadingBlock label="Checking availability…" /> : null}

          <ul className="flex flex-col gap-2.5" data-testid="selection-list">
            {albumRows.map((row) => {
              const discoveryUnavailable = row.availability?.available === false;
              const waiting = waitingAlbumIds.has(row.collectionId);
              const packReason = packLockReason(row.allowForward, { waiting });
              const packLocked = Boolean(packReason) && !discoveryUnavailable;
              const showAsk = mayAskToPutInPack({
                trading,
                ownCompany: Boolean(myCompanyId) && row.companyId === myCompanyId,
                waiting,
                packLocked,
                lookOnly: lookOnlyCompanyIds.has(row.companyId),
              });
              return (
                <SelectionRow
                  key={`c-${row.collectionId}`}
                  href={selectionRowHref('Collection', row.collectionId)}
                  name={row.name}
                  companyName={row.companyName}
                  thumbUrl={row.coverImage}
                  unavailable={discoveryUnavailable}
                  packLocked={packLocked}
                  reason={row.availability?.reason ?? packReason}
                  askState={
                    showAsk
                      ? askingKey === `c-${row.collectionId}`
                        ? 'asking'
                        : 'ask'
                      : undefined
                  }
                  onAsk={() => void onAskAlbum(row.collectionId)}
                  onRemove={() => albumPick.removeIds([row.collectionId])}
                />
              );
            })}
            {designRows.map((row) => {
              const discoveryUnavailable = row.availability?.available === false;
              const hasGrant = grantedIds.has(row.productId);
              const packOpen =
                packOpenIds.has(row.productId) || row.sourcePackAllowForward === true;
              const waiting = Boolean(pendingByProductId[row.productId]);
              const packReason = packLockReason(row.allowForward, {
                hasGrant,
                waiting,
                sourcePackAllowForward: packOpen,
              });
              const listChrome = selectionListDesignChrome({
                discoveryUnavailable,
                availabilityReason: row.availability?.reason,
                packReason,
              });
              const showAsk = mayAskToPutInPack({
                trading,
                ownCompany: Boolean(myCompanyId) && row.companyId === myCompanyId,
                waiting,
                packLocked: listChrome.packLocked,
                lookOnly: lookOnlyCompanyIds.has(row.companyId),
              });
              return (
                <SelectionRow
                  key={`p-${row.productId}`}
                  href={selectionRowHref('Design', row.productId)}
                  name={row.name}
                  companyName={row.companyName}
                  thumbUrl={row.thumbUrl}
                  unavailable={discoveryUnavailable}
                  packLocked={listChrome.packLocked}
                  reason={listChrome.reason}
                  askState={
                    showAsk
                      ? askingKey === `p-${row.productId}`
                        ? 'asking'
                        : 'ask'
                      : undefined
                  }
                  askLabel={CURATE_ASK_RELIST}
                  onAsk={
                    showAsk
                      ? () => onAskDesign(row.productId, row.sourceCollectionId)
                      : undefined
                  }
                  onRemove={() => shortlist.removeIds([row.productId])}
                />
              );
            })}
          </ul>

          {typeof document !== 'undefined' ? (
            <div
              className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md"
              data-testid="selection-cart-dock"
            >
              {/*
                Phone-column dock (same as Explore selecting): chrome stays inside
                max-w-md — never a full-laptop white bar when Cart opens on desktop.
              */}
              <div className="pointer-events-auto flex flex-col gap-2.5 border-t border-line bg-surface/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
                {availableTotal < 1 && !resolving ? (
                  <p className="text-[13px] text-muted">Nothing available to act on</p>
                ) : null}
                {packAskDesigns.length > 1 ? (
                  <Button
                    variant="secondary"
                    fullWidth
                    disabled={askingKey != null}
                    data-testid="selection-ask-all-relist"
                    onClick={() => {
                      setAskingKey('all-relist');
                      const batches = groupRelistAskBatches(packAskDesigns);
                      void (async () => {
                        try {
                          for (const batch of batches) {
                            await api.post<RelistRequestView>('/relist-requests', batch);
                          }
                          void queryClient.invalidateQueries({ queryKey: ['relist-access'] });
                        } catch (err) {
                          showToast(
                            err instanceof ApiError ? err.message : 'Could not ask.',
                            'danger',
                          );
                        } finally {
                          setAskingKey(null);
                        }
                      })();
                    }}
                  >
                    {askingKey === 'all-relist'
                      ? 'Asking…'
                      : curateAskAllLabel(packAskDesigns.length)}
                  </Button>
                ) : null}
                <div
                  className="flex items-stretch gap-2"
                  data-testid="selection-cart-actions"
                >
                  {(() => {
                    const secondary = [shown.curate, shown.bookmark, shown.share].filter(Boolean)
                      .length;
                    if (secondary < 1) return null;
                    return (
                      <div
                        className={cx(
                          'grid min-w-0 flex-1 gap-1.5',
                          secondary === 3
                            ? 'grid-cols-3'
                            : secondary === 2
                              ? 'grid-cols-2'
                              : 'grid-cols-1',
                        )}
                      >
                        {shown.curate ? (
                          <DockIconButton
                            testId="selection-curate"
                            label="Repost"
                            disabled={availableTotal < 1 || savingPick}
                            onClick={onCurate}
                          >
                            <RepostIcon width={22} height={22} />
                          </DockIconButton>
                        ) : null}
                        {shown.bookmark ? (
                          <DockIconButton
                            testId="selection-bookmark"
                            label={savingPick ? 'Saving…' : 'Bookmark'}
                            disabled={availableTotal < 1 || savingPick}
                            onClick={() => void onBookmark()}
                          >
                            <BookmarkIcon width={22} height={22} />
                          </DockIconButton>
                        ) : null}
                        {shown.share ? (
                          <DockIconButton
                            testId="selection-share"
                            label="Share"
                            disabled={availableTotal < 1 || savingPick}
                            onClick={() => {
                              toastSkippedUnavailable();
                              setShareOpen(true);
                            }}
                          >
                            <PaperPlaneIcon width={22} height={22} />
                          </DockIconButton>
                        ) : null}
                      </div>
                    );
                  })()}
                  {shown.order ? (
                    <button
                      type="button"
                      data-testid="selection-order"
                      disabled={availableTotal < 1 || savingPick}
                      onClick={onOrder}
                      className={cx(
                        'flex min-h-12 min-w-[5.75rem] shrink-0 items-center justify-center rounded-xl px-4',
                        'border border-accent bg-accent text-sm font-bold text-white',
                        'disabled:opacity-40',
                      )}
                    >
                      Order
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="self-center py-1 text-[13px] font-medium text-muted hover:text-ink"
                  onClick={onClear}
                  data-testid="selection-clear"
                >
                  Clear cart
                </button>
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
          writeCartDesigns([...unavailableDesigns, ...nextShortlist]);
          writeCartAlbums([...unavailableAlbums, ...remainingAlbums]);
          setOrderResolveOpen(false);
          if (navigateToCollectionId) {
            writeResumeAfterAlbumPick('order');
            navigate(`/collections/${navigateToCollectionId}`, {
              state: { enterSelect: true },
            });
            return;
          }
          clearResumeAfterAlbumPick();
          setQtyEntries(nextShortlist);
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
          writeCartDesigns([...unavailableDesigns, ...nextShortlist]);
          const keptAlbums = new Map<string, BrowseAlbumEntry>();
          for (const entry of [...unavailableAlbums, ...lockedAlbums, ...remainingAlbums]) {
            keptAlbums.set(entry.collectionId, entry);
          }
          writeCartAlbums([...keptAlbums.values()]);
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
          clearBrowseCart();
        }}
      />
      <HowManyEachSheet
        open={orderFlow.qtyOpen}
        onClose={() => {
          orderFlow.setQtyOpen(false);
          setQtyEntries(null);
        }}
        sellerId={
          availableDesigns.length === 0
            ? 'multi'
            : availableDesigns.length === 1
              ? availableDesigns[0]!.companyId
              : availableDesigns.every((entry) => entry.companyId === availableDesigns[0]?.companyId)
                ? availableDesigns[0]!.companyId
                : 'multi'
        }
        products={entriesAsProducts(
          qtyEntries ?? (resolving ? shortlist.entries : availableDesigns),
        )}
        submitting={orderFlow.submitting}
        asking={orderFlow.asking}
        error={orderFlow.error}
        orderGoesToName={packHandlerName(resolving ? shortlist.entries : availableDesigns)}
        onRemoveProduct={(productId) => shortlist.removeIds([productId])}
        onSendOrder={(lines, place) => {
          const linesForPath = qtyEntries ?? (resolving ? shortlist.entries : availableDesigns);
          orderFlow.sendOrder(lines, {
            ...place,
            collectionId: collectionIdForPackOrder(linesForPath),
          });
        }}
        onAskRates={(lines, place) => {
          const linesForPath = qtyEntries ?? (resolving ? shortlist.entries : availableDesigns);
          orderFlow.askRates(lines, {
            ...place,
            collectionId: collectionIdForPackOrder(linesForPath),
          });
        }}
        sheetJob="order"
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
        onCurated={() => clearBrowseCart()}
      />
    </div>
  );
}

function SelectionRow({
  href,
  name,
  companyName,
  thumbUrl,
  unavailable,
  packLocked,
  reason,
  askState,
  askLabel = CURATE_ASK_RELIST,
  onAsk,
  onRemove,
}: {
  href: string;
  name: string;
  companyName: string;
  thumbUrl: string | null;
  unavailable?: boolean;
  packLocked?: boolean;
  reason?: string;
  askState?: 'ask' | 'asking';
  askLabel?: string;
  onAsk?: () => void;
  onRemove: () => void;
}) {
  const faded = Boolean(unavailable || packLocked);
  const thumb = thumbUrl ? (
    <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
  ) : (
    <span className="flex h-full w-full items-center justify-center bg-foam text-sm font-bold text-muted">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
  return (
    <li
      className={cx(
        'flex items-center gap-3.5 rounded-xl border border-line bg-surface p-2.5 pr-2',
        faded && 'opacity-45',
      )}
      data-unavailable={unavailable ? 'true' : undefined}
      data-pack-locked={packLocked ? 'true' : undefined}
    >
      <Link
        to={href}
        aria-label={`Open ${name}`}
        data-testid="selection-row-thumb"
        className="h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-lg"
      >
        {thumb}
      </Link>
      <div className="min-w-0 flex-1 py-0.5">
        <p
          className={cx(
            'truncate text-[15px] font-semibold leading-snug tracking-tight',
            faded ? 'text-muted' : 'text-ink',
          )}
        >
          {name}
        </p>
        {companyName ? (
          <p className="mt-0.5 truncate text-[13px] leading-snug text-muted">{companyName}</p>
        ) : null}
        {faded && reason ? (
          <p
            className="mt-1 text-[12px] font-medium text-muted"
            data-testid={unavailable ? 'selection-unavailable-reason' : 'selection-pack-lock-reason'}
          >
            {reason}
          </p>
        ) : null}
        {askState ? (
          <button
            type="button"
            className="mt-1.5 text-[13px] font-semibold text-accent disabled:opacity-50"
            disabled={askState === 'asking'}
            onClick={onAsk}
            data-testid="selection-ask-relist"
          >
            {askState === 'asking' ? 'Asking…' : askLabel}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        aria-label={`Remove ${name}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[1.25rem] leading-none text-muted hover:bg-foam hover:text-ink"
        onClick={onRemove}
      >
        ×
      </button>
    </li>
  );
}
