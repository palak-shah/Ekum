import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  OrderIntent,
  OrderKind,
  type AccessRequestView,
  type CollectionCard,
  type CompanyContactPoint,
  type ConnectionView,
  type CursorPage,
  type ExploreProductCard,
  type OrderView,
  type PublicCompanyProfile,
  type PublicCompanySummary,
  type ThreadSummary,
  categoryDisplayLabel,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useCompanyId } from '@/lib/auth';
import {
  readDesignBrowseLayout,
  writeDesignBrowseLayout,
  type DesignBrowseLayout,
} from '@/lib/designBrowseLayout';
import {
  DEFAULT_ACCESS_REQUEST_NOTE,
  resolveAccessRequestNote,
} from '@/lib/accessRequestNote';
import type { BrowseAlbumEntry } from '@/features/browse/browseAlbumPick';
import { writeBrowseAlbumPick } from '@/features/browse/browseAlbumPick';
import type { BrowseShortlistEntry } from '@/features/browse/browseShortlist';
import { writeBrowseShortlist } from '@/features/browse/browseShortlist';
import { CurateFromSelectionSheet } from '@/features/browse/CurateFromSelectionSheet';
import { OrderCollectionResolveSheet } from '@/features/browse/OrderCollectionResolveSheet';
import {
  clearResumeAfterAlbumPick,
  writeResumeAfterAlbumPick,
} from '@/features/browse/resumeAfterAlbumPick';
import { entriesAsProducts } from '@/features/browse/useShortlistOrderFlow';
import { SelectAllFloat } from '@/features/browse/SelectAllFloat';
import { selectAllState } from '@/features/browse/selectAllState';
import { applySelectingPill } from '@/features/browse/selectingPill';
import { useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import { navigateToOrderChat } from '@/features/orders/navigateToOrderChat';
import { useTradePresence } from '@/lib/tradePresence';
import { useToast } from '@/ui/Toast';
import { PageHeader } from '@/ui/PageHeader';
import { Avatar, Button, ErrorState, Field, LoadingBlock, SearchInput, Sheet, Tag, TextArea, cx } from '@/ui/kit';
import { catalogSearchMatches, designFindParts } from '@/features/catalog/catalogSearch';
import { CatalogFindToggle } from '@/features/catalog/catalogFindToggle';
import { CompanyShareSheet } from './CompanyShareSheet';
import { ShopCollectionCell, ShopPhotoCell, ShopPhotoGrid } from './ShopPhotoGrid';
import { companyOpenedFromChat, shopCollectionPhoto, shopDesignPhoto } from './shopPhoto';
import {
  shouldShowShopTradeDock,
  shopAlbumEntries,
  shopShortlistEntries,
} from './shopTradeDock';

type ShopTab = 'designs' | 'collections';

function toShopShortlistEntry(
  product: ExploreProductCard,
  shopCompanyId: string,
): BrowseShortlistEntry {
  return {
    productId: product.id,
    name: product.name,
    thumbUrl: product.images[0] ?? null,
    companyId: shopCompanyId,
    companyName: product.company.name,
    unit: product.unit ?? null,
    rate: product.rate ?? null,
  };
}

function toShopAlbumEntry(collection: CollectionCard, shopCompanyId: string): BrowseAlbumEntry {
  return {
    collectionId: collection.id,
    name: collection.name,
    coverImage: shopCollectionPhoto(collection),
    companyId: shopCompanyId,
    companyName: collection.company.name,
    productCount: collection.productCount,
    allowForward: collection.allowForward,
    orderPathPreference: collection.orderPathPreference,
  };
}

export function CompanyProfilePage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const myCompanyId = useCompanyId();
  const isOwn = Boolean(id) && id === myCompanyId;
  const fromChat = companyOpenedFromChat(location.state);
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const { trading } = useTradePresence();
  const { showToast } = useToast();
  const [gateOpen, setGateOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [qtyOpen, setQtyOpen] = useState(false);
  const [curateOpen, setCurateOpen] = useState(false);
  const [orderResolveOpen, setOrderResolveOpen] = useState(false);
  const [curateResolveOpen, setCurateResolveOpen] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [note, setNote] = useState(DEFAULT_ACCESS_REQUEST_NOTE);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [shopTab, setShopTab] = useState<ShopTab>('designs');
  const [listSearch, setListSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const deferredListSearch = useDeferredValue(listSearch);
  const [layout, setLayout] = useState<DesignBrowseLayout>(() =>
    readDesignBrowseLayout(myCompanyId),
  );
  const shopTabSeededFor = useRef<string | null>(null);

  useEffect(() => {
    setLayout(readDesignBrowseLayout(myCompanyId));
  }, [myCompanyId]);

  const profile = useQuery({
    queryKey: ['company', id],
    queryFn: () => api.get<PublicCompanyProfile>(`/companies/${id}`),
  });
  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
  });
  const outgoing = useQuery({
    queryKey: ['access-requests', 'outgoing'],
    queryFn: () => api.get<AccessRequestView[]>('/access-requests/outgoing'),
  });
  const following = useQuery({
    queryKey: ['follows', 'following'],
    queryFn: () => api.get<PublicCompanySummary[]>('/follows/following'),
  });
  const shopCollections = useQuery({
    queryKey: ['company', id, 'collections'],
    queryFn: () =>
      api.get<CursorPage<CollectionCard>>(`/companies/${id}/collections`, { limit: 20 }),
    enabled: Boolean(id),
  });
  const shopDesigns = useQuery({
    queryKey: ['company', id, 'designs'],
    queryFn: () =>
      api.get<CursorPage<ExploreProductCard>>(`/companies/${id}/designs`, { limit: 20 }),
    enabled: Boolean(id),
  });

  const connection = connections.data?.find((item) => item.company.id === id);
  const isConnected = connection?.status === 'active';
  const pendingRequest = outgoing.data?.find(
    (item) => item.company.id === id && item.status === 'pending',
  );
  const isFollowing =
    profile.data?.following === true ||
    (following.data?.some((item) => item.id === id) ?? false);
  const isFollowPending = profile.data?.followPending === true;

  const contacts = useQuery({
    queryKey: ['company', id, 'contact'],
    queryFn: () => api.get<CompanyContactPoint[]>(`/companies/${id}/contact`),
    enabled: Boolean(id) && isConnected,
  });

  const designs = shopDesigns.data?.results ?? [];
  const collections = shopCollections.data?.results ?? [];
  const visibleDesigns = useMemo(
    () =>
      designs.filter((row) =>
        catalogSearchMatches(deferredListSearch, ...designFindParts(row)),
      ),
    [designs, deferredListSearch],
  );
  const visibleCollections = useMemo(
    () =>
      collections.filter((row) =>
        catalogSearchMatches(
          deferredListSearch,
          row.name,
          row.categories,
          row.memberFind,
        ),
      ),
    [collections, deferredListSearch],
  );
  const listSearchActive = Boolean(deferredListSearch.trim());
  const shopLoading = shopDesigns.isLoading || shopCollections.isLoading;
  const shopReady = shopDesigns.isSuccess && shopCollections.isSuccess;
  const visibleShopIds = designs.map((product) => product.id);
  const visibleAlbumIds = collections.map((collection) => collection.id);
  const gridDesignIds = visibleDesigns.map((product) => product.id);
  const gridAlbumIds = visibleCollections.map((collection) => collection.id);
  const shopEntries = shopShortlistEntries(shortlist.entries, id, visibleShopIds);
  const shopAlbums = shopAlbumEntries(albumPick.entries, id, visibleAlbumIds);
  const thisShopCount = shopEntries.length + shopAlbums.length;
  const shopDockUp = shouldShowShopTradeDock({
    isOwn,
    shopSelectedCount: thisShopCount,
  });
  const selecting = shortlist.selectMode || albumPick.selectMode || shopDockUp;
  const selectAllDesigns = selectAllState(gridDesignIds, shortlist.productIds);
  const selectAllAlbums = selectAllState(gridAlbumIds, albumPick.collectionIds);
  const selectAll = shopTab === 'designs' ? selectAllDesigns : selectAllAlbums;
  const shopSelectAllOpen =
    selecting &&
    ((shopTab === 'designs' && visibleDesigns.length > 0) ||
      (shopTab === 'collections' && visibleCollections.length > 0));
  const canSelect =
    (shopTab === 'designs' && designs.length > 0) ||
    (shopTab === 'collections' && collections.length > 0);
  const tabHasItems = canSelect;
  const toggleLayout = () => {
    setLayout((prev) => {
      const next = prev === 'feed' ? 'grid' : 'feed';
      writeDesignBrowseLayout(myCompanyId, next);
      return next;
    });
  };
  const floaterClearance = !shopDockUp && shortlist.count + albumPick.count > 0;
  const showMessage = !isOwn && !fromChat;
  const lookOnlyFollow =
    !isConnected &&
    (isFollowPending || (isFollowing && profile.data?.canPutInPack !== true));
  const canCurate = shopDockUp && trading && !lookOnlyFollow;

  const clearThisShop = () => {
    shortlist.removeIds(shopEntries.map((entry) => entry.productId));
    albumPick.removeIds(shopAlbums.map((entry) => entry.collectionId));
  };

  const toggleDesign = (product: ExploreProductCard) => {
    shortlist.toggle(toShopShortlistEntry(product, id));
  };

  const toggleCollection = (collection: CollectionCard) => {
    albumPick.toggle(toShopAlbumEntry(collection, id));
  };

  useEffect(() => {
    if (!shopReady || shopTabSeededFor.current === id) return;
    shopTabSeededFor.current = id;
    setShopTab(designs.length > 0 ? 'designs' : 'collections');
  }, [shopReady, id, designs.length]);

  const refreshAfterAccess = () => {
    void queryClient.invalidateQueries({ queryKey: ['access-requests'] });
    void queryClient.invalidateQueries({ queryKey: ['connections'] });
    void queryClient.invalidateQueries({ queryKey: ['threads'] });
  };

  const toggleFollow = useMutation({
    mutationFn: () =>
      isFollowing || isFollowPending
        ? api.del(`/follows/${id}`)
        : api.post('/follows', { companyId: id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['follows'] });
      void queryClient.invalidateQueries({ queryKey: ['company', id] });
      void queryClient.invalidateQueries({ queryKey: ['explore', 'home'] });
    },
  });

  const requestAccess = useMutation({
    mutationFn: () =>
      api.post<AccessRequestView>('/access-requests', {
        targetCompanyId: id,
        note: resolveAccessRequestNote(note),
      }),
    onSuccess: () => {
      setGateOpen(false);
      setNote(DEFAULT_ACCESS_REQUEST_NOTE);
      setActionError(null);
      setSuccessNote('Request sent — they will see it in chat.');
      refreshAfterAccess();
    },
    onError: (error) =>
      setActionError(error instanceof ApiError ? error.message : 'Could not send request.'),
  });

  const startChat = useMutation({
    mutationFn: () => api.post<ThreadSummary>('/threads/direct', { companyId: id }),
    onSuccess: (thread) => {
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      navigate(`/chats/${thread.id}`);
    },
    onError: (error) =>
      setActionError(error instanceof ApiError ? error.message : 'Could not open chat.'),
  });

  const placeShopOrder = useMutation({
    mutationFn: (input: {
      intent: typeof OrderIntent.Order | typeof OrderIntent.Inquiry;
      lines: Array<{ productId: string; quantity: number; note?: string }>;
    }) =>
      api.post<OrderView & { threadId?: string | null }>('/orders', {
        sellerCompanyId: id,
        kind: OrderKind.Standard,
        ...(input.intent === OrderIntent.Inquiry ? { intent: OrderIntent.Inquiry } : {}),
        items: input.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          images: [],
          ...(line.note?.trim() ? { note: line.note.trim() } : {}),
        })),
      }),
    onSuccess: (order, input) => {
      setQtyOpen(false);
      setOrderError(null);
      shortlist.removeIds(input.lines.map((line) => line.productId));
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      if (input.intent === OrderIntent.Inquiry) {
        showToast('Rate request sent');
      }
      void navigateToOrderChat(navigate, queryClient, order, { replace: true });
    },
    onError: (error, input) =>
      setOrderError(
        error instanceof ApiError
          ? error.message
          : input.intent === OrderIntent.Inquiry
            ? 'Could not ask for rates.'
            : 'Could not place the order.',
      ),
  });

  if (profile.isLoading) {
    return <LoadingBlock label="Loading business…" />;
  }
  if (profile.isError || !profile.data) {
    return (
      <>
        <PageHeader title="Business" />
        <ErrorState message="This business isn't available." />
      </>
    );
  }

  const company = profile.data;
  const hasShop = designs.length > 0 || collections.length > 0;
  const contact = pickPrimaryContact(contacts.data ?? []);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={company.name}
        action={
          <div className="flex items-center gap-0.5">
            {hasShop ? (
              <CatalogFindToggle
                testId="company-shop-search-toggle"
                open={searchOpen}
                label={shopTab === 'collections' ? 'Find collections' : 'Find designs'}
                onToggle={() => {
                  if (searchOpen) {
                    setSearchOpen(false);
                    setListSearch('');
                    return;
                  }
                  setSearchOpen(true);
                }}
              />
            ) : null}
            {tabHasItems ? (
              <button
                type="button"
                data-testid="company-shop-layout-toggle"
                aria-label={layout === 'feed' ? 'Grid view' : 'Feed view'}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/5"
                onClick={toggleLayout}
              >
                {layout === 'feed' ? 'Grid' : 'Feed'}
              </button>
            ) : null}
          </div>
        }
      />

      <SelectAllFloat
        open={shopSelectAllOpen}
        count={thisShopCount}
        allSelected={selectAll.allSelected}
        onSelectAll={() => {
          if (shopTab === 'designs') {
            shortlist.addMany(visibleDesigns.map((product) => toShopShortlistEntry(product, id)));
            return;
          }
          albumPick.addMany(
            visibleCollections.map((collection) => toShopAlbumEntry(collection, id)),
          );
        }}
        onClear={clearThisShop}
      />

      <div className="flex items-start gap-4">
        <Avatar name={company.name} imageUrl={company.logoUrl} size={88} />
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-sm text-muted">{company.city}</p>
          {company.verification === 'gst_verified' ? (
            <div className="mt-1">
              <Tag tone="success">GST verified</Tag>
            </div>
          ) : null}
          {company.about ? <p className="mt-2 text-sm text-ink">{company.about}</p> : null}
          {company.categories.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {company.categories.map((category) => (
                <Tag key={category}>{categoryDisplayLabel(category)}</Tag>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2">
        {!isOwn ? (
          <Button
            variant="secondary"
            className="min-h-9 min-w-0 flex-1 whitespace-nowrap px-2 text-xs font-semibold"
            data-testid="company-follow"
            onClick={() => toggleFollow.mutate()}
            disabled={toggleFollow.isPending}
          >
            {toggleFollow.isPending
              ? 'Updating…'
              : isFollowing
                ? 'Following'
                : isFollowPending
                  ? 'Pending'
                  : 'Follow'}
          </Button>
        ) : null}
        {showMessage ? (
          <Button
            variant="secondary"
            className="min-h-9 min-w-0 flex-1 whitespace-nowrap px-2 text-xs font-semibold"
            data-testid="company-message"
            onClick={() => startChat.mutate()}
            disabled={startChat.isPending}
          >
            {startChat.isPending ? 'Opening…' : pendingRequest ? 'Chat' : 'Message'}
          </Button>
        ) : null}
        {isOwn ? (
          <Button
            variant="secondary"
            className="min-h-9 min-w-0 flex-1 whitespace-nowrap px-2 text-xs font-semibold"
            data-testid="company-edit"
            onClick={() => navigate('/settings/profile')}
          >
            Edit
          </Button>
        ) : null}
        <Button
          variant="secondary"
          className="min-h-9 min-w-0 flex-1 whitespace-nowrap px-2 text-xs font-semibold"
          data-testid="company-share"
          onClick={() => setShareOpen(true)}
        >
          Share
        </Button>
        {!isOwn && !isConnected ? (
          pendingRequest ? (
            <Button
              variant="secondary"
              className="min-h-9 min-w-0 flex-1 whitespace-nowrap px-2 text-xs font-semibold"
              disabled
            >
              Asked
            </Button>
          ) : (
            <Button
              className="min-h-9 min-w-0 flex-1 whitespace-nowrap px-2 text-xs font-semibold"
              data-testid="company-request"
              onClick={() => {
                setNote(DEFAULT_ACCESS_REQUEST_NOTE);
                setGateOpen(true);
              }}
            >
              Request
            </Button>
          )
        ) : null}
      </div>

      {!isOwn ? (
        <p className="text-xs text-muted" data-testid="company-follow-hint">
          Follow = ask to see their new designs. Request access = rates and orders.
        </p>
      ) : null}

      {isConnected && !isOwn ? (
        <div className="min-w-0" data-testid="company-contact">
          {contacts.isLoading ? (
            <p className="text-xs text-muted">Loading contact…</p>
          ) : contact ? (
            <>
              <p className="truncate text-sm text-ink">
                {contact.name}
                {contact.role ? (
                  <span className="font-normal text-muted"> · {contact.role}</span>
                ) : null}
              </p>
              {contact.phone ? (
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                  className="truncate text-sm font-medium text-accent"
                >
                  {contact.phone}
                </a>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {successNote ? <p className="text-center text-xs text-accent">{successNote}</p> : null}
      {actionError ? <p className="text-center text-xs text-danger">{actionError}</p> : null}

      {shopLoading ? (
        <LoadingBlock label="Loading shop…" />
      ) : (
        <section
          className={cx(
            'flex flex-col gap-2',
            shopDockUp && 'pb-[calc(6.5rem+env(safe-area-inset-bottom))]',
            floaterClearance && 'pb-[calc(5rem+5.5rem)]',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {(
                [
                  ['designs', 'Designs', designs.length],
                  ['collections', 'Collections', collections.length],
                ] as const
              ).map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  data-testid={`company-shop-tab-${value}`}
                  onClick={() => setShopTab(value)}
                  className={cx(
                    'rounded-full px-3.5 py-1.5 text-sm font-medium',
                    shopTab === value ? 'bg-accent text-white' : 'bg-foam text-muted',
                  )}
                >
                  {label}
                  {count > 0 ? ` · ${count}` : ''}
                </button>
              ))}
            </div>
            {canSelect ? (
              <button
                type="button"
                className={cx(
                  'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold',
                  selecting ? 'bg-accent text-white' : 'text-accent hover:bg-accent/5',
                )}
                onClick={() =>
                  applySelectingPill(selecting, thisShopCount, {
                    clear: clearThisShop,
                    setSelectMode: (on) => {
                      shortlist.setSelectMode(on);
                      albumPick.setSelectMode(on);
                    },
                  })
                }
              >
                {selecting ? 'Selecting' : 'Select'}
              </button>
            ) : null}
          </div>
          {hasShop && searchOpen ? (
            <SearchInput
              data-testid="company-shop-search"
              aria-label={shopTab === 'collections' ? 'Find collections' : 'Find designs'}
              placeholder={shopTab === 'collections' ? 'Find collections' : 'Find designs'}
              value={listSearch}
              onChange={(event) => setListSearch(event.target.value)}
            />
          ) : null}
          {hasShop ? (
            shopTab === 'designs' ? (
              visibleDesigns.length > 0 ? (
                <ShopPhotoGrid layout={layout}>
                  {visibleDesigns.map((product) => (
                    <ShopPhotoCell
                      key={product.id}
                      src={shopDesignPhoto(product)}
                      label={product.name}
                      to={`/explore/products/${product.id}`}
                      showName
                      testId={`company-shop-design-${product.id}`}
                      selected={shortlist.productIds.has(product.id)}
                      selectMode={selecting}
                      onLongSelect={() => toggleDesign(product)}
                      onToggleSelect={selecting ? () => toggleDesign(product) : undefined}
                    />
                  ))}
                </ShopPhotoGrid>
              ) : (
                <p className="px-0.5 text-sm text-muted">
                  {listSearchActive ? 'No designs match.' : 'No published designs yet.'}
                </p>
              )
            ) : visibleCollections.length > 0 ? (
              <ShopPhotoGrid layout={layout}>
                {visibleCollections.map((collection) => (
                  <ShopCollectionCell
                    key={collection.id}
                    collection={collection}
                    selected={albumPick.collectionIds.has(collection.id)}
                    selectMode={selecting}
                    onLongSelect={() => toggleCollection(collection)}
                    onToggleSelect={selecting ? () => toggleCollection(collection) : undefined}
                  />
                ))}
              </ShopPhotoGrid>
            ) : (
              <p className="px-0.5 text-sm text-muted">
                {listSearchActive ? 'No collections match.' : 'No published collections yet.'}
              </p>
            )
          ) : (
            <p className="px-0.5 text-sm text-muted">
              Nothing visible to you — they may not have published yet, or posts are limited to
              selected companies.
            </p>
          )}
        </section>
      )}

      {shopDockUp ? (
        <div
          className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md gap-2 border-t border-line bg-surface/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"
          data-testid="company-shop-dock"
        >
          {canCurate ? (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                if (shopAlbums.length > 0) setCurateResolveOpen(true);
                else setCurateOpen(true);
              }}
            >
              Curate
            </Button>
          ) : null}
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setOrderError(null);
              if (shopAlbums.length > 0) setOrderResolveOpen(true);
              else setQtyOpen(true);
            }}
          >
            Ask for rates
          </Button>
          <Button
            fullWidth
            data-testid="company-shop-order"
            onClick={() => {
              setOrderError(null);
              if (shopAlbums.length > 0) setOrderResolveOpen(true);
              else setQtyOpen(true);
            }}
          >
            Order
          </Button>
        </div>
      ) : null}

      <OrderCollectionResolveSheet
        intent="order"
        open={orderResolveOpen}
        onClose={() => setOrderResolveOpen(false)}
        albums={shopAlbums}
        designCount={shopEntries.length}
        existingShortlist={shopEntries}
        onResolved={({ shortlist: nextShortlist, remainingAlbums, navigateToCollectionId }) => {
          const otherDesigns = shortlist.entries.filter((entry) => entry.companyId !== id);
          const otherAlbums = albumPick.entries.filter((entry) => entry.companyId !== id);
          writeBrowseShortlist([...otherDesigns, ...nextShortlist]);
          writeBrowseAlbumPick([...otherAlbums, ...remainingAlbums]);
          setOrderResolveOpen(false);
          if (navigateToCollectionId) {
            writeResumeAfterAlbumPick('order');
            navigate(`/collections/${navigateToCollectionId}`, {
              state: { enterSelect: true },
            });
            return;
          }
          clearResumeAfterAlbumPick();
          setQtyOpen(true);
        }}
      />
      <OrderCollectionResolveSheet
        intent="curate"
        open={curateResolveOpen}
        onClose={() => setCurateResolveOpen(false)}
        albums={shopAlbums}
        designCount={shopEntries.length}
        existingShortlist={shopEntries}
        onResolved={({ shortlist: nextShortlist, remainingAlbums, navigateToCollectionId }) => {
          const otherDesigns = shortlist.entries.filter((entry) => entry.companyId !== id);
          const otherAlbums = albumPick.entries.filter((entry) => entry.companyId !== id);
          writeBrowseShortlist([...otherDesigns, ...nextShortlist]);
          writeBrowseAlbumPick([...otherAlbums, ...remainingAlbums]);
          setCurateResolveOpen(false);
          if (navigateToCollectionId) {
            writeResumeAfterAlbumPick('curate');
            navigate(`/collections/${navigateToCollectionId}`, {
              state: { enterSelect: true },
            });
            return;
          }
          clearResumeAfterAlbumPick();
          setCurateOpen(true);
        }}
      />

      <HowManyEachSheet
        open={qtyOpen}
        onClose={() => setQtyOpen(false)}
        sellerId={id}
        products={entriesAsProducts(shopEntries)}
        submitting={placeShopOrder.isPending && placeShopOrder.variables?.intent !== OrderIntent.Inquiry}
        asking={placeShopOrder.isPending && placeShopOrder.variables?.intent === OrderIntent.Inquiry}
        error={orderError}
        orderGoesToName={company.name}
        onSendOrder={(lines) => {
          setOrderError(null);
          placeShopOrder.mutate({ intent: OrderIntent.Order, lines });
        }}
        onAskRates={(lines) => {
          setOrderError(null);
          placeShopOrder.mutate({ intent: OrderIntent.Inquiry, lines });
        }}
      />

      <CurateFromSelectionSheet
        open={curateOpen}
        onClose={() => setCurateOpen(false)}
        productIds={shopEntries.map((entry) => entry.productId)}
      />

      <CompanyShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        companyId={id}
        companyName={company.name}
      />

      <Sheet
        open={gateOpen}
        onClose={() => {
          setGateOpen(false);
          setNote(DEFAULT_ACCESS_REQUEST_NOTE);
        }}
        title={`Request access · ${company.name}`}
      >
        <div className="flex flex-col gap-3">
          <Field
            label="Add a note"
            hint="Tap to write your own. Leave empty to send the default."
            error={actionError}
          >
            <TextArea
              value={note}
              onFocus={() => {
                if (note === DEFAULT_ACCESS_REQUEST_NOTE) setNote('');
              }}
              onChange={(event) => setNote(event.target.value)}
              placeholder={DEFAULT_ACCESS_REQUEST_NOTE}
            />
          </Field>
          <Button fullWidth onClick={() => requestAccess.mutate()} disabled={requestAccess.isPending}>
            {requestAccess.isPending ? 'Sending…' : 'Send request'}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function pickPrimaryContact(contacts: CompanyContactPoint[]): CompanyContactPoint | null {
  if (contacts.length === 0) return null;
  const owner = contacts.find((point) => /owner/i.test(point.role ?? ''));
  return owner ?? contacts[0] ?? null;
}
