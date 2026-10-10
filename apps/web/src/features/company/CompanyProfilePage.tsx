import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  OrderIntent,
  OrderKind,
  type CollectionCard,
  type CompanyContactPoint,
  type ConnectionView,
  type CursorPage,
  type ExploreProductCard,
  type CreateOrdersBatchResult,
  type MuteFor,
  type PublicCompanyProfile,
  type PublicCompanySummary,
  type ThreadSummary,
  categoryDisplayLabel,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { seePacksShopLabel, shopWriteLabel } from './seePacksCopy';
import { shopShelfLoading } from './shopShelfLoading';
import {
  ChatIcon,
  CollectionIcon,
  LockIcon,
  MoreHorizontalIcon,
  OrdersIcon,
  ProductIcon,
  PaperPlaneIcon,
  UnlockIcon,
} from '@/ui/icons';
import { BrowseLayoutToggle } from '@/ui/BrowseLayoutToggle';
import { useCompanyId } from '@/lib/auth';
import {
  readDesignBrowseLayout,
  writeDesignBrowseLayout,
  type DesignBrowseLayout,
} from '@/lib/designBrowseLayout';
import type { BrowseAlbumEntry } from '@/features/browse/browseAlbumPick';
import { writeBrowseAlbumPick } from '@/features/browse/browseAlbumPick';
import type { BrowseShortlistEntry } from '@/features/browse/browseShortlist';
import { writeBrowseShortlist } from '@/features/browse/browseShortlist';
import {
  BottomTradeDock,
  DockIconButton,
  SELECTION_DOCK_CLEARANCE_CLASS,
} from '@/features/browse/BottomTradeDock';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { OrderCollectionResolveSheet } from '@/features/browse/OrderCollectionResolveSheet';
import {
  clearResumeAfterAlbumPick,
  writeResumeAfterAlbumPick,
} from '@/features/browse/resumeAfterAlbumPick';
import { SelectionMessageSheet } from '@/features/browse/SelectionMessageSheet';
import { entriesAsProducts, sellerIdForEntries } from '@/features/browse/useShortlistOrderFlow';
import { packHandlerName } from '@/features/browse/packOrderSource';
import { batchConfirmTitle, batchSuccessLeave } from '@/features/orders/BatchOrderConfirmSheet';
import { selectAllState } from '@/features/browse/selectAllState';
import { SelectModeControls } from '@/features/browse/SelectModeControls';
import { useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import { navigateToOrderChat } from '@/features/orders/navigateToOrderChat';
import { useToast } from '@/ui/Toast';
import { PageHeader } from '@/ui/PageHeader';
import { GstTick, isGstVerified } from '@/ui/GstTick';
import { shopSellCategories } from '@/ui/shopIdentity';
import { Avatar, ErrorState, LoadingBlock, SearchInput, Tag, cx } from '@/ui/kit';
import { catalogSearchMatches, designFindParts } from '@/features/catalog/catalogSearch';
import { CatalogFindToggle } from '@/features/catalog/catalogFindToggle';
import { invalidateFollowCatalog } from '@/features/network/invalidateFollowCatalog';
import { CompanyOverflowMenu } from './CompanyOverflowMenu';
import { CompanyShareSheet } from './CompanyShareSheet';
import { ShopCollectionCell, ShopPhotoCell, ShopPhotoGrid } from './ShopPhotoGrid';
import { shopCollectionPhoto, shopDesignPhoto } from './shopPhoto';
import {
  findDirectThreadForCompany,
  shopOverflowItems,
} from './shopOverflowMenu';
import {
  shouldShowShopTradeDock,
  shopAlbumEntries,
  shopShortlistEntries,
  shopTabSelectedCount,
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
    companyId: product.company.id,
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const myCompanyId = useCompanyId();
  const isOwn = Boolean(id) && id === myCompanyId;
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const { showToast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [catalogShareOpen, setCatalogShareOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [qtyOpen, setQtyOpen] = useState(false);
  const [qtyEntries, setQtyEntries] = useState<BrowseShortlistEntry[] | null>(null);
  const [orderResolveOpen, setOrderResolveOpen] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [shopTab, setShopTab] = useState<ShopTab>('collections');
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
  const following = useQuery({
    queryKey: ['follows', 'following'],
    queryFn: () => api.get<PublicCompanySummary[]>('/follows/following'),
  });
  const threads = useQuery({
    queryKey: ['threads'],
    queryFn: () => api.get<CursorPage<ThreadSummary>>('/threads', { limit: 50 }),
    enabled: Boolean(id) && !isOwn,
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
  const isConnected =
    profile.data?.connected === true || connection?.status === 'active';
  const alreadyTalks = isConnected || profile.data?.hasChat === true;
  const isFollowing =
    profile.data?.following === true ||
    (following.data?.some((item) => item.id === id) ?? false);
  const isFollowPending = profile.data?.followPending === true;
  const directThread = findDirectThreadForCompany(threads.data?.results, id);
  const overflowItems = shopOverflowItems({
    isOwn,
    hasDirectThread: Boolean(directThread),
    followPending: isFollowPending,
    following: isFollowing,
  });

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
  const shopLoading = shopShelfLoading(
    shopTab,
    shopCollections.isLoading,
    shopDesigns.isLoading,
  );
  const shopReady =
    shopTab === 'collections' ? shopCollections.isSuccess : shopDesigns.isSuccess;
  const visibleShopIds = designs.map((product) => product.id);
  const visibleAlbumIds = collections.map((collection) => collection.id);
  const gridDesignIds = visibleDesigns.map((product) => product.id);
  const gridAlbumIds = visibleCollections.map((collection) => collection.id);
  const shopEntries = shopShortlistEntries(shortlist.entries, id, visibleShopIds);
  const shopAlbums = shopAlbumEntries(albumPick.entries, id, visibleAlbumIds);
  const thisShopCount = shopEntries.length + shopAlbums.length;
  const tabSelectedCount = shopTabSelectedCount(
    shopTab,
    shopEntries.length,
    shopAlbums.length,
  );
  const shopDockUp = shouldShowShopTradeDock({
    isOwn,
    shopSelectedCount: thisShopCount,
  });
  const selecting = shortlist.selectMode || albumPick.selectMode || shopDockUp;
  const selectAllDesigns = selectAllState(gridDesignIds, shortlist.productIds);
  const selectAllAlbums = selectAllState(gridAlbumIds, albumPick.collectionIds);
  const selectAll = shopTab === 'designs' ? selectAllDesigns : selectAllAlbums;
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
  const floaterClearance =
    !isOwn && !shopDockUp && shortlist.count + albumPick.count > 0;
  const showMessage = !isOwn;

  const clearThisShop = () => {
    shortlist.removeIds(shopEntries.map((entry) => entry.productId));
    albumPick.removeIds(shopAlbums.map((entry) => entry.collectionId));
  };

  /** Clear only the active tab — selected designs must not look like selected collections. */
  const clearActiveTab = () => {
    if (shopTab === 'designs') {
      shortlist.removeIds(shopEntries.map((entry) => entry.productId));
      return;
    }
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
    setShopTab('collections');
  }, [shopReady, id, designs.length]);

  const toggleFollow = useMutation({
    mutationFn: () =>
      isFollowing || isFollowPending
        ? api.del(`/follows/${id}`)
        : api.post('/follows', { companyId: id }),
    onSuccess: () => {
      invalidateFollowCatalog(queryClient);
    },
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

  const setThreadAlert = useMutation({
    mutationFn: (payload: { alertLevel: 'all' | 'muted'; muteFor?: MuteFor }) =>
      api.patch(`/threads/${directThread!.id}/alert`, {
        alertLevel: payload.alertLevel,
        ...(payload.muteFor ? { muteFor: payload.muteFor } : {}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      setMoreOpen(false);
    },
    onError: (error) =>
      showToast(error instanceof ApiError ? error.message : 'Could not update mute.', 'danger'),
  });

  const blockShop = useMutation({
    mutationFn: async () => {
      await api.post(`/connections/company/${id}/block`, {});
      if (directThread) {
        await api.post(`/threads/${directThread.id}/decline`, {});
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      void queryClient.invalidateQueries({ queryKey: ['connections'] });
      showToast('Blocked');
      navigate(-1);
    },
    onError: (error) =>
      showToast(error instanceof ApiError ? error.message : 'Could not block this shop.', 'danger'),
  });

  const placeShopOrder = useMutation({
    mutationFn: (input: {
      lines: Array<{ productId: string; quantity: number; note?: string }>;
      transporter?: string;
    }) =>
      api.post<CreateOrdersBatchResult>('/orders/batch', {
        kind: OrderKind.Standard,
        intent: OrderIntent.Order,
        ...(input.transporter?.trim() ? { transporter: input.transporter.trim() } : {}),
        items: input.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          images: [],
          ...(line.note?.trim() ? { note: line.note.trim() } : {}),
        })),
      }),
    onSuccess: (payload, input) => {
      setQtyOpen(false);
      setQtyEntries(null);
      setOrderError(null);
      const failedIds = new Set(payload.failures.flatMap((failure) => failure.productIds));
      shortlist.removeIds(input.lines.map((line) => line.productId).filter((pid) => !failedIds.has(pid)));
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      const title = batchConfirmTitle(payload);
      showToast(title, payload.orders.length === 0 ? 'danger' : 'success');
      const leave = batchSuccessLeave(payload);
      if (leave?.kind === 'order') {
        void navigateToOrderChat(navigate, queryClient, leave.order, { replace: true });
      }
    },
    onError: (error) =>
      setOrderError(error instanceof ApiError ? error.message : 'Could not place the order.'),
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
  const sellCats = shopSellCategories(company);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={company.name}
        titleEnd={isGstVerified(company.verification) ? <GstTick /> : null}
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
            <div className="relative">
              <button
                type="button"
                data-testid="company-more"
                aria-label="More"
                aria-expanded={moreOpen}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-foam hover:text-ink"
                onClick={() => setMoreOpen((open) => !open)}
              >
                <MoreHorizontalIcon width={18} height={18} />
              </button>
              <CompanyOverflowMenu
                open={moreOpen}
                title={company.name}
                items={overflowItems}
                muted={directThread?.alertLevel === 'muted'}
                mutePending={setThreadAlert.isPending}
                onClose={() => setMoreOpen(false)}
                onShare={() => setShareOpen(true)}
                onMute={() => setThreadAlert.mutate({ alertLevel: 'all' })}
                onPickMute={(muteFor) =>
                  setThreadAlert.mutate({ alertLevel: 'muted', muteFor })
                }
                onBlock={() => {
                  if (
                    typeof window !== 'undefined' &&
                    !window.confirm(`Block ${company.name}? They won’t know.`)
                  ) {
                    return;
                  }
                  blockShop.mutate();
                }}
                onRemove={() => toggleFollow.mutate()}
              />
            </div>
          </div>
        }
        below={
          searchOpen ? (
            <SearchInput
              data-testid="company-shop-search"
              aria-label={shopTab === 'collections' ? 'Find collections' : 'Find designs'}
              placeholder={shopTab === 'collections' ? 'Find collections' : 'Find designs'}
              value={listSearch}
              onChange={(event) => setListSearch(event.target.value)}
              autoFocus
            />
          ) : null
        }
      />

      <div className="flex items-start gap-4">
        <Avatar name={company.name} imageUrl={company.logoUrl} size={88} />
        <div className="min-w-0 flex-1 pt-1">
          {isConnected && !isOwn && contact ? (
            <p className="truncate text-sm font-medium text-ink" data-testid="company-contact">
              {contact.name}
              {contact.role ? ` ${contact.role}` : ''}
            </p>
          ) : null}
          <p className="text-sm text-muted" data-testid="shop-identity">
            {company.city}
          </p>
          {company.about ? <p className="mt-2 text-sm text-ink">{company.about}</p> : null}
          {sellCats.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5" data-testid="shop-category-chips">
              {sellCats.map((category) => (
                <Tag key={category}>{categoryDisplayLabel(category)}</Tag>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex gap-1.5">
        {!isOwn ? (
          <button
            type="button"
            data-testid="company-follow"
            onClick={() => toggleFollow.mutate()}
            disabled={toggleFollow.isPending}
            className={cx(
              shopActionClass,
              'gap-1.5',
              isFollowing && !isFollowPending
                ? 'bg-accent text-white disabled:opacity-45'
                : isFollowPending
                  ? 'border border-accent/40 bg-foam text-ink disabled:opacity-45'
                  : 'bg-foam text-ink disabled:opacity-45',
            )}
          >
            {!toggleFollow.isPending && isFollowing && !isFollowPending ? (
              <UnlockIcon width={14} height={14} className="shrink-0" aria-hidden />
            ) : null}
            {!toggleFollow.isPending && !(isFollowing && !isFollowPending) ? (
              <LockIcon width={14} height={14} className="shrink-0" aria-hidden />
            ) : null}
            {toggleFollow.isPending
              ? 'Updating…'
              : seePacksShopLabel({ pending: isFollowPending, allowed: isFollowing })}
          </button>
        ) : null}
        {showMessage ? (
          <button
            type="button"
            data-testid="company-message"
            onClick={() => startChat.mutate()}
            disabled={startChat.isPending}
            className={cx(shopActionClass, 'gap-1.5 bg-foam text-ink disabled:opacity-45')}
          >
            {!startChat.isPending ? (
              <ChatIcon width={14} height={14} className="shrink-0" aria-hidden />
            ) : null}
            {startChat.isPending ? 'Opening…' : shopWriteLabel(alreadyTalks)}
          </button>
        ) : null}
        {isOwn ? (
          <button
            type="button"
            data-testid="company-edit"
            onClick={() => navigate('/settings/profile?edit=1')}
            className={cx(shopActionClass, 'flex-none bg-foam text-ink')}
          >
            Edit profile
          </button>
        ) : null}
      </div>

      {successNote ? <p className="text-center text-xs text-accent">{successNote}</p> : null}
      {actionError ? <p className="text-center text-xs text-danger">{actionError}</p> : null}

      {shopLoading ? (
        <LoadingBlock label="Loading shop…" />
      ) : (
        <section
          className={cx(
            'flex flex-col gap-2',
            (shopDockUp || floaterClearance) && SELECTION_DOCK_CLEARANCE_CLASS,
          )}
        >
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                {(
                  [
                    ['collections', 'Collections', CollectionIcon],
                    ['designs', 'Designs', ProductIcon],
                  ] as const
                ).map(([value, label, TabIcon]) => (
                  <button
                    key={value}
                    type="button"
                    data-testid={`company-shop-tab-${value}`}
                    onClick={() => setShopTab(value)}
                    className={cx(
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium',
                      shopTab === value ? 'bg-accent text-white' : 'bg-foam text-muted',
                    )}
                  >
                    <TabIcon width={14} height={14} className="shrink-0" aria-hidden />
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {tabHasItems ? (
                  <BrowseLayoutToggle
                    layout={layout}
                    onToggle={toggleLayout}
                    testId="company-shop-layout-toggle"
                  />
                ) : null}
                {canSelect ? (
                  <SelectModeControls
                    selectTestId="company-shop-select"
                    selecting={selecting}
                    count={tabSelectedCount}
                    allSelected={selectAll.allSelected}
                    onEnterSelect={() => {
                      shortlist.setSelectMode(true);
                      albumPick.setSelectMode(true);
                    }}
                    onSelectAll={() => {
                      if (shopTab === 'designs') {
                        shortlist.addMany(
                          visibleDesigns.map((product) => toShopShortlistEntry(product, id)),
                        );
                        return;
                      }
                      albumPick.addMany(
                        visibleCollections.map((collection) => toShopAlbumEntry(collection, id)),
                      );
                    }}
                    onClear={() => {
                      clearActiveTab();
                      shortlist.setSelectMode(false);
                      albumPick.setSelectMode(false);
                    }}
                  />
                ) : null}
              </div>
            </div>
          </div>
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
                      layout={layout}
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
                    layout={layout}
                    packManage={isOwn}
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
        <BottomTradeDock testId="company-shop-dock" aboveAppNav={false}>
          <div className="grid w-full grid-cols-3 gap-2" data-testid="company-shop-dock-actions">
            <DockIconButton
              testId="company-shop-message"
              label="Message"
              onClick={() => setMessageOpen(true)}
            >
              <ChatIcon width={22} height={22} />
            </DockIconButton>
            <DockIconButton
              testId="company-shop-share"
              label="Share"
              onClick={() => setCatalogShareOpen(true)}
            >
              <PaperPlaneIcon width={22} height={22} />
            </DockIconButton>
            <DockIconButton
              testId="company-shop-order"
              label="Order"
              primary
              onClick={() => {
                setOrderError(null);
                if (shopAlbums.length > 0) setOrderResolveOpen(true);
                else setQtyOpen(true);
              }}
            >
              <OrdersIcon width={22} height={22} />
            </DockIconButton>
          </div>
        </BottomTradeDock>
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
          setQtyEntries(nextShortlist);
          setQtyOpen(true);
        }}
      />

      <HowManyEachSheet
        open={qtyOpen}
        onClose={() => {
          setQtyOpen(false);
          setQtyEntries(null);
        }}
        sellerId={sellerIdForEntries(qtyEntries ?? shopEntries)}
        products={entriesAsProducts(qtyEntries ?? shopEntries)}
        submitting={placeShopOrder.isPending}
        error={orderError}
        orderGoesToName={packHandlerName(qtyEntries ?? shopEntries) ?? company.name}
        sheetJob="order"
        onSendOrder={(lines, place) => {
          setOrderError(null);
          placeShopOrder.mutate({
            lines,
            transporter: place?.transporter,
          });
        }}
        onAskRates={() => undefined}
      />

      <SelectionMessageSheet
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        shopId={id}
        shopName={company.name}
        collections={shopAlbums.map((entry) => ({
          collectionId: entry.collectionId,
          name: entry.name,
        }))}
        products={shopEntries.map((entry) => ({
          productId: entry.productId,
          name: entry.name,
        }))}
      />

      <CatalogShareSheet
        open={catalogShareOpen}
        onClose={() => setCatalogShareOpen(false)}
        collections={shopAlbums.map((entry) => ({
          collectionId: entry.collectionId,
          name: entry.name,
          image: entry.coverImage,
        }))}
        products={shopEntries.map((entry) => ({
          productId: entry.productId,
          name: entry.name,
          image: entry.thumbUrl,
        }))}
        onShared={() => clearThisShop()}
      />

      <CompanyShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        companyId={id}
        companyName={company.name}
      />

    </div>
  );
}

/** Compact shop actions — Instagram / WhatsApp density, not kit min-h-12. */
const shopActionClass =
  'inline-flex h-8 min-w-0 flex-1 items-center justify-center rounded-lg px-2.5 text-[13px] font-semibold tracking-tight';

function pickPrimaryContact(contacts: CompanyContactPoint[]): CompanyContactPoint | null {
  if (contacts.length === 0) return null;
  const owner = contacts.find((point) => /owner/i.test(point.role ?? ''));
  return owner ?? contacts[0] ?? null;
}
