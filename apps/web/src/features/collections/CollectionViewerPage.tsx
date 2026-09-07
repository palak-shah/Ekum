import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  OrderIntent,
  OrderKind,
  type CollectionPreviewView,
  type CollectionViewGrantView,
  type CollectionViewRequestView,
  type CreateOrdersBatchResult,
  type CreateOrdersFromPackResult,
  type OrderView,
  type ProductView,
  type ThreadSummary,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { formatRate } from '@/lib/format';
import { useMyCompany } from '@/lib/queries';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { SelectAllFloat } from '@/features/browse/SelectAllFloat';
import { selectAllState } from '@/features/browse/selectAllState';
import { useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import type { BrowseShortlistEntry } from '@/features/browse/browseShortlist';
import { shouldFallbackPackOrderToBatch } from '@/features/browse/packOrderSource';
import {
  continueAfterAlbumPickLabel,
  nextStepAfterAlbumPick,
  readResumeAfterAlbumPick,
} from '@/features/browse/resumeAfterAlbumPick';
import {
  isPublishedForSelection,
  selectionSkipToast,
  travelingSelectionToggleGate,
} from '@/features/browse/selectionEligibility';
import { PhotoViewer } from '@/ui/PhotoViewer';
import {
  rememberCatalogHandlerName,
  rememberForwardFacilitator,
  rememberOrderPath,
  resolveOrderPathForCatalog,
} from '@/features/browse/forwardAttribution';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import { navigateToOrderChat } from '@/features/orders/navigateToOrderChat';
import { useSaveToggle } from '@/features/saved/useSaveToggle';
import { PageHeader } from '@/ui/PageHeader';
import { CompanyRow } from '@/ui/cards';
import { collectionOwnerSourceLine } from '@/features/catalog/collectionOwnerSourceLine';
import { collectionViewerPrimaryAction } from '@/features/collections/collectionViewerChrome';
import {
  Button,
  Card,
  ErrorState,
  LoadingBlock,
  Sheet,
  StatusPill,
  cx,
} from '@/ui/kit';
import { CheckIcon, LockIcon, MoreHorizontalIcon } from '@/ui/icons';
import { useToast } from '@/ui/Toast';
import { useLongPress } from '@/ui/useLongPress';
import { coverMissingFromMembers } from './collectionCover';

type Layout = 'feed' | 'grid';

function toShortlistEntry(
  product: ProductView,
  companyName: string,
  pack?: { collectionId: string; handlerName: string; path: string | null },
): BrowseShortlistEntry {
  const path = pack?.path === 'handle' || pack?.path === 'direct' ? pack.path : undefined;
  return {
    productId: product.id,
    name: product.name,
    thumbUrl: product.images[0] ?? null,
    companyId: product.companyId,
    companyName: product.companyName ?? companyName,
    allowForward: product.allowForward,
    ...(pack
      ? {
          sourceCollectionId: pack.collectionId,
          sourceHandlerName: pack.handlerName,
          sourcePath: path,
        }
      : {}),
  };
}

export function CollectionViewerPage() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useMyCompany();
  const { showToast } = useToast();
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const [layout, setLayout] = useState<Layout>('grid');
  const [viewerProduct, setViewerProduct] = useState<ProductView | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [qtyOpen, setQtyOpen] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [morePos, setMorePos] = useState({ top: 0, right: 8 });
  const moreAnchorRef = useRef<HTMLButtonElement>(null);
  const morePanelRef = useRef<HTMLDivElement>(null);

  const enterSelect = Boolean(
    (location.state as { enterSelect?: boolean } | null)?.enterSelect,
  );

  useEffect(() => {
    if (!enterSelect) return;
    shortlist.setSelectMode(true);
    navigate(location.pathname + location.search, { replace: true, state: {} });
  }, [enterSelect, shortlist, navigate, location.pathname, location.search]);

  const onContinueAfterAlbumPick = () => {
    const resume = readResumeAfterAlbumPick();
    const step = nextStepAfterAlbumPick({
      resume,
      remainingAlbumIds: albumPick.entries.map((entry) => entry.collectionId),
    });
    if (!step) return;
    if (step.kind === 'next-album') {
      albumPick.removeIds([step.collectionId]);
      navigate(`/collections/${step.collectionId}`, { state: { enterSelect: true } });
      return;
    }
    navigate('/selection', {
      state: step.resume === 'curate' ? { openCurate: true } : { openOrder: true },
    });
  };

  useLayoutEffect(() => {
    if (!moreOpen) return;
    const place = () => {
      const anchor = moreAnchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setMorePos({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [moreOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    const close = () => setMoreOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (morePanelRef.current?.contains(target)) return;
      if (moreAnchorRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', close, true);
    };
  }, [moreOpen]);

  const collection = useQuery({
    queryKey: ['collection-preview', id],
    queryFn: () => api.get<CollectionPreviewView>(`/explore/collections/${id}`),
  });
  const save = useSaveToggle({ collectionId: id });
  const outgoingAsks = useQuery({
    queryKey: ['collection-view-requests', 'outgoing'],
    queryFn: () =>
      api.get<CollectionViewRequestView[]>('/collection-view-requests/outgoing'),
  });

  const products = collection.data?.products ?? [];
  const selectedCount = shortlist.count;
  const selectMode = shortlist.selectMode;
  const resumeAfterPick = readResumeAfterAlbumPick();
  const showResumeContinue = Boolean(resumeAfterPick && selectMode);
  const companyId = collection.data?.company.id ?? '';
  const isOwner = Boolean(me.data?.id && companyId && me.data.id === companyId);
  const viewGrants = useQuery({
    queryKey: ['collection-view-grants', id],
    queryFn: () => api.get<CollectionViewGrantView[]>(`/collections/${id}/view-grants`),
    enabled: Boolean(id) && isOwner,
  });
  const isCuratedPack = useMemo(() => {
    const ownerId = collection.data?.company.id;
    if (!ownerId || products.length === 0) return false;
    return products.some((product) => product.companyId !== ownerId);
  }, [collection.data?.company.id, products]);
  const packPath =
    collection.data?.orderPathPreference === 'handle' ||
    collection.data?.orderPathPreference === 'direct'
      ? collection.data.orderPathPreference
      : resolveOrderPathForCatalog({
          catalogKind: 'collection',
          catalogId: id,
          queryPath: searchParams.get('path'),
        }) ?? null;
  const handlePack =
    isCuratedPack &&
    (packPath === 'handle' || collection.data?.orderPathPreference === 'handle');
  const packStamp =
    id && collection.data
      ? {
          collectionId: id,
          handlerName: collection.data.company.name,
          path: packPath,
        }
      : undefined;

  useEffect(() => {
    if (!id || !collection.data || !handlePack) return;
    rememberOrderPath('collection', id, 'handle');
    rememberCatalogHandlerName('collection', id, collection.data.company.name);
    rememberForwardFacilitator('collection', id, collection.data.company.id);
  }, [id, collection.data, handlePack]);
  const canSelectDesigns = products.length > 0;
  const companyName = collection.data?.company.name ?? '';

  const ownerSourceLine = useMemo(() => {
    if (!isOwner || !collection.data) return null;
    const shops = products.map((product) => ({
      id: product.companyId,
      name: product.companyName?.trim() || 'a shop',
    }));
    return collectionOwnerSourceLine(collection.data.company.id, shops);
  }, [isOwner, collection.data, products]);

  const visibleDesignIds = products.map((product) => product.id);
  const selectAll = selectAllState(visibleDesignIds, shortlist.productIds);
  const onSelectAllVisible = () => {
    const published = products.filter((product) => isPublishedForSelection(product.status));
    const skipped = products.length - published.length;
    const notice = selectionSkipToast(skipped, published.length);
    if (notice) showToast(notice);
    if (published.length < 1) return;
    shortlist.addMany(
      published.map((product) =>
        toShortlistEntry(product, product.companyName ?? companyName, packStamp),
      ),
    );
  };
  const onClearVisible = () => {
    shortlist.removeIds(visibleDesignIds);
  };

  const accessPending =
    Boolean(id) &&
    (outgoingAsks.data?.some(
      (item) => item.collectionId === id && item.status === 'pending',
    ) ??
      false);

  const askToSee = useMutation({
    mutationFn: () =>
      api.post<CollectionViewRequestView>('/collection-view-requests', {
        collectionId: id,
      }),
    onSuccess: (row) => {
      setActionError(null);
      setSuccessNote('Ask sent — they decide in chat.');
      void queryClient.invalidateQueries({ queryKey: ['collection-view-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      if (row.threadId) navigate(`/chats/${row.threadId}`);
    },
    onError: (error) =>
      setActionError(error instanceof ApiError ? error.message : 'Could not send ask.'),
  });

  const revokeGrant = useMutation({
    mutationFn: (granteeId: string) =>
      api.del(`/collections/${id}/view-grants/${granteeId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['collection-view-grants', id] });
      showToast('Removed access to this pack.');
    },
    onError: (error) =>
      showToast(error instanceof ApiError ? error.message : 'Could not remove.', 'danger'),
  });

  const startChat = useMutation({
    mutationFn: () => api.post<ThreadSummary>('/threads/direct', { companyId }),
    onSuccess: (thread) => navigate(`/chats/${thread.id}`),
    onError: (error) =>
      setActionError(error instanceof ApiError ? error.message : 'Could not open chat.'),
  });

  const packOrder = useMutation({
    mutationFn: async (input: {
      intent: typeof OrderIntent.Order | typeof OrderIntent.Inquiry;
      lines: Array<{ productId: string; quantity: number }>;
    }) => {
      const items = input.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        images: [] as string[],
      }));
      const batchBody = {
        kind: OrderKind.Standard,
        intent: input.intent,
        items,
      };
      try {
        return await api.post<CreateOrdersFromPackResult>('/orders/from-pack', {
          collectionId: id,
          kind: OrderKind.Standard,
          intent: input.intent,
          items,
        });
      } catch (err) {
        if (err instanceof ApiError && shouldFallbackPackOrderToBatch(err.code)) {
          const batch = await api.post<CreateOrdersBatchResult>('/orders/batch', batchBody);
          const downstream = batch.orders[0] as OrderView | undefined;
          if (!downstream) {
            throw new ApiError({
              statusCode: 400,
              code: 'ORDER_FAILED',
              message: 'Could not place the order.',
            });
          }
          return {
            downstream,
            upstreams: [],
            failures: batch.failures ?? [],
          } satisfies CreateOrdersFromPackResult;
        }
        throw err;
      }
    },
    onSuccess: (payload, variables) => {
      setQtyOpen(false);
      setOrderError(null);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      if (variables.intent === OrderIntent.Inquiry) {
        showToast('Rate request sent');
      }
      void navigateToOrderChat(navigate, queryClient, payload.downstream);
    },
    onError: (error, variables) => {
      const inquiry = variables.intent === OrderIntent.Inquiry;
      setOrderError(
        error instanceof ApiError
          ? error.message
          : inquiry
            ? 'Could not ask for rates.'
            : 'Could not place the order.',
      );
    },
  });

  const toggleProduct = (product: ProductView) => {
    const gate = travelingSelectionToggleGate({
      status: product.status,
      alreadySelected: shortlist.productIds.has(product.id),
    });
    if (!gate.allow) {
      if (gate.toast) showToast(gate.toast);
      return;
    }
    shortlist.toggle(toShortlistEntry(product, product.companyName ?? companyName, packStamp));
  };

  const openViewer = (product: ProductView, index = 0) => {
    setViewerProduct(product);
    setViewerIndex(index);
  };

  const onDesignActivate = (product: ProductView) => {
    if (selectMode) {
      toggleProduct(product);
      return;
    }
    openViewer(product, 0);
  };

  const onDesignLongSelect = (product: ProductView) => {
    toggleProduct(product);
  };

  if (collection.isLoading) {
    return <LoadingBlock label="Loading collection…" />;
  }
  if (collection.isError || !collection.data) {
    return (
      <>
        <PageHeader title="Collection" />
        <ErrorState message="This collection isn't available." />
      </>
    );
  }

  const primaryAction = collectionViewerPrimaryAction(isOwner);

  const openAlbumShare = () => {
    setShareOpen(true);
  };

  const data = collection.data;
  const floaterClearance = selectedCount + albumPick.count > 0 || showResumeContinue;

  return (
    <div
      className={cx(
        'flex flex-col gap-4',
        floaterClearance && (showResumeContinue ? 'pb-[calc(5rem+10rem)]' : 'pb-[calc(5rem+5.5rem)]'),
      )}
    >
      <PageHeader
        title={data.name}
        subtitle={`${data.productCount} designs`}
        action={
          <div className="flex items-center gap-1">
            {primaryAction === 'edit' ? (
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/5"
                onClick={() => navigate(`/catalog/collections/${id}`)}
              >
                Edit
              </button>
            ) : (
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/5 disabled:opacity-45"
                disabled={!id || save.isPending}
                onClick={() => save.toggle()}
              >
                {save.isSaved ? 'Bookmarked' : 'Bookmark'}
              </button>
            )}
            <button
              ref={moreAnchorRef}
              type="button"
              aria-label="More"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              data-testid="collection-more"
              onClick={() => setMoreOpen((open) => !open)}
              className={cx(
                'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                moreOpen ? 'bg-foam text-ink' : 'text-muted hover:bg-foam hover:text-ink',
              )}
            >
              <MoreHorizontalIcon width={18} height={18} />
            </button>
          </div>
        }
      />

      {moreOpen && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-[60] cursor-default bg-ink/15"
                onClick={() => setMoreOpen(false)}
              />
              <div
                ref={morePanelRef}
                role="menu"
                className="fixed z-[61] min-w-[11rem] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[var(--shadow-soft)]"
                style={{ top: morePos.top, right: morePos.right }}
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={!id}
                  className="flex w-full px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70 disabled:opacity-40"
                  onClick={() => {
                    setMoreOpen(false);
                    openAlbumShare();
                  }}
                >
                  Share
                </button>
                {data.products ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70"
                    onClick={() => {
                      setMoreOpen(false);
                      setLayout((prev) => (prev === 'feed' ? 'grid' : 'feed'));
                    }}
                  >
                    {layout === 'feed' ? 'Grid view' : 'Feed view'}
                  </button>
                ) : null}
                {isOwner ? (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={!id || save.isPending}
                    className="flex w-full px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70 disabled:opacity-40"
                    onClick={() => {
                      setMoreOpen(false);
                      save.toggle();
                    }}
                  >
                    {save.isSaved ? 'Remove bookmark' : 'Bookmark'}
                  </button>
                ) : null}
              </div>
            </>,
            document.body,
          )
        : null}

      <SelectAllFloat
        open={selectMode && products.length > 0}
        count={selectedCount}
        allSelected={selectAll.allSelected}
        onSelectAll={onSelectAllVisible}
        onClear={onClearVisible}
      />

      {showResumeContinue && resumeAfterPick && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-x-0 bottom-[4.75rem] z-30 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-md"
              data-testid="album-pick-continue"
            >
              <div className="mx-auto max-w-md">
                <Button fullWidth onClick={onContinueAfterAlbumPick}>
                  {continueAfterAlbumPickLabel(resumeAfterPick, albumPick.count)}
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}

      {data.products &&
      data.coverImage &&
      (layout === 'feed' || coverMissingFromMembers(data.coverImage, data.products)) ? (
        <img src={data.coverImage} alt={data.name} className="h-44 w-full rounded-2xl object-cover" />
      ) : null}

      <CompanyRow company={data.company} to={`/company/${data.company.id}`} />
      {ownerSourceLine ? (
        <p className="px-0.5 text-xs text-muted">{ownerSourceLine}</p>
      ) : null}

      {data.products ? (
        layout === 'feed' ? (
          <div className="flex flex-col gap-4">
            {products.map((product) => (
              <DesignTile
                key={product.id}
                variant="feed"
                product={product}
                selected={shortlist.productIds.has(product.id)}
                selectMode={selectMode}
                showOrigin={isOwner && product.companyId !== data.company.id}
                onActivate={() => onDesignActivate(product)}
                onLongSelect={() => onDesignLongSelect(product)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <DesignTile
                key={product.id}
                variant="grid"
                product={product}
                selected={shortlist.productIds.has(product.id)}
                selectMode={selectMode}
                showOrigin={isOwner && product.companyId !== data.company.id}
                onActivate={() => onDesignActivate(product)}
                onLongSelect={() => onDesignLongSelect(product)}
              />
            ))}
          </div>
        )
      ) : accessPending ? (
        <AccessPendingCard
          companyId={data.company.id}
          companyName={data.company.name}
          onOpenChat={() => startChat.mutate()}
          opening={startChat.isPending}
        />
      ) : (
        <Card className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foam text-muted">
            <LockIcon />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Ask to see this collection</p>
            <p className="text-xs text-muted">
              Ask {data.company.name} to open all {data.productCount} designs. This is not a
              connect request.
            </p>
          </div>
          <Button onClick={() => askToSee.mutate()} disabled={askToSee.isPending}>
            {askToSee.isPending ? 'Asking…' : 'Ask to see'}
          </Button>
          <Link to={`/company/${data.company.id}`} className="text-xs font-medium text-accent">
            Follow or Request access on their profile
          </Link>
        </Card>
      )}

      {data.products && isCuratedPack && !isOwner ? (
        handlePack ? (
          <Card className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-ink">Order goes to {data.company.name}</p>
            <p className="text-xs text-muted">
              You chat with them. They send the mill lots on.
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setOrderError(null);
                  setQtyOpen(true);
                }}
              >
                Ask for rates
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  setOrderError(null);
                  setQtyOpen(true);
                }}
              >
                Order
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-ink">Message to order these designs</p>
            <p className="text-xs text-muted">
              This pack mixes designs from more than one business. Chat to place an order.
            </p>
            <Button
              fullWidth
              onClick={() => startChat.mutate()}
              disabled={startChat.isPending}
            >
              {startChat.isPending ? 'Opening…' : 'Open chat'}
            </Button>
          </Card>
        )
      ) : null}

      {isOwner && (viewGrants.data?.length ?? 0) > 0 ? (
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-ink">Granted on request</p>
          <p className="text-xs text-muted">
            Businesses you Allowed for this pack only — not Connections.
          </p>
          <ul className="flex flex-col gap-2">
            {viewGrants.data!.map((grant) => (
              <li
                key={grant.companyId}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="min-w-0 truncate font-medium text-ink">
                  {grant.company.name}
                </span>
                <button
                  type="button"
                  className="shrink-0 text-xs font-semibold text-danger"
                  disabled={revokeGrant.isPending}
                  onClick={() => revokeGrant.mutate(grant.companyId)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {successNote ? <p className="text-center text-xs text-accent">{successNote}</p> : null}
      {actionError ? <p className="text-center text-xs text-danger">{actionError}</p> : null}

      <CatalogShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        collections={
          id && data
            ? [{ collectionId: id, name: data.name, image: data.coverImage }]
            : []
        }
        products={[]}
      />

      {handlePack && !isOwner ? (
        <HowManyEachSheet
          open={qtyOpen}
          onClose={() => setQtyOpen(false)}
          sellerId={data.company.id}
          products={(
            products.filter(
              (product) =>
                isPublishedForSelection(product.status) &&
                shortlist.productIds.has(product.id),
            ).length > 0
              ? products.filter(
                  (product) =>
                    isPublishedForSelection(product.status) &&
                    shortlist.productIds.has(product.id),
                )
              : products.filter((product) => isPublishedForSelection(product.status))
          ).map((product) => ({
            ...product,
            images: product.images ?? [],
          }))}
          submitting={packOrder.isPending && packOrder.variables?.intent !== OrderIntent.Inquiry}
          asking={packOrder.isPending && packOrder.variables?.intent === OrderIntent.Inquiry}
          error={orderError}
          orderGoesToName={data.company.name}
          onSendOrder={(lines) => {
            setOrderError(null);
            packOrder.mutate({ intent: OrderIntent.Order, lines });
          }}
          onAskRates={(lines) => {
            setOrderError(null);
            packOrder.mutate({ intent: OrderIntent.Inquiry, lines });
          }}
        />
      ) : null}

      <ProductPhotosSheet
        product={viewerProduct}
        index={viewerIndex}
        onIndex={setViewerIndex}
        onClose={() => setViewerProduct(null)}
        selectable={canSelectDesigns}
        selected={viewerProduct ? shortlist.productIds.has(viewerProduct.id) : false}
        onToggleSelect={() => {
          if (viewerProduct) {
            toggleProduct(viewerProduct);
          }
        }}
      />
    </div>
  );
}

function AccessPendingCard({
  companyId,
  companyName,
  onOpenChat,
  opening,
}: {
  companyId: string;
  companyName: string;
  onOpenChat: () => void;
  opening: boolean;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foam text-muted">
        <LockIcon />
      </span>
      <div>
        <div className="mb-1 flex items-center justify-center gap-2">
          <p className="text-sm font-semibold text-ink">Waiting for them</p>
          <StatusPill status="pending" />
        </div>
        <p className="text-xs text-muted">
          Asked {companyName} to open this collection. Designs unlock after they Allow in
          chat.
        </p>
      </div>
      <Button onClick={onOpenChat} disabled={opening}>
        {opening ? 'Opening…' : 'Open chat'}
      </Button>
      <Link to={`/company/${companyId}`} className="text-xs font-medium text-accent">
        Follow or Request access on their profile
      </Link>
    </Card>
  );
}

function DesignTile({
  product,
  selected,
  selectMode,
  variant,
  showOrigin = false,
  onActivate,
  onLongSelect,
}: {
  product: ProductView;
  selected: boolean;
  selectMode: boolean;
  variant: 'feed' | 'grid';
  showOrigin?: boolean;
  onActivate: () => void;
  onLongSelect?: () => void;
}) {
  const image = product.images[0] ?? null;
  const extraPhotos = Math.max(0, product.images.length - 1);
  const meta = [product.sku, formatRate(product.rate, product.unit)].filter(Boolean).join(' · ');
  const origin =
    showOrigin && product.companyName?.trim()
      ? `From ${product.companyName.trim()}`
      : null;
  const longPress = useLongPress(onLongSelect);

  return (
    <div
      className={cx(
        'overflow-hidden rounded-2xl border text-left',
        selected ? 'border-accent bg-accent/5' : 'border-line bg-surface',
      )}
    >
      <button
        type="button"
        onClick={onActivate}
        className="relative block w-full"
        {...longPress}
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            className={cx(
              'w-full object-cover',
              variant === 'feed' ? 'aspect-[3/4]' : 'h-36',
            )}
            loading="lazy"
          />
        ) : (
          <div
            className={cx(
              'flex w-full items-center justify-center bg-foam font-bold text-muted',
              variant === 'feed' ? 'aspect-[3/4] text-4xl' : 'h-36 text-2xl',
            )}
          >
            {product.name.charAt(0).toUpperCase()}
          </div>
        )}
        {extraPhotos > 0 ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-bold text-white">
            +{extraPhotos}
          </span>
        ) : null}
        {selectMode ? (
          <span className="absolute right-2 top-2">
            <SelectMark selected={selected} />
          </span>
        ) : null}
      </button>
      <button
        type="button"
        onClick={onActivate}
        className={cx('block w-full text-left', variant === 'feed' ? 'p-3' : 'p-2.5')}
        {...longPress}
      >
        <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
        {origin ? <p className="truncate text-xs text-muted">{origin}</p> : null}
        {meta ? <p className="truncate text-xs text-muted">{meta}</p> : null}
      </button>
    </div>
  );
}

function ProductPhotosSheet({
  product,
  index,
  onIndex,
  onClose,
  selectable,
  selected,
  onToggleSelect,
}: {
  product: ProductView | null;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [photoOpen, setPhotoOpen] = useState(false);
  useEffect(() => {
    if (!product) setPhotoOpen(false);
  }, [product]);

  if (!product) return null;
  const urls = product.images;
  const safeIndex = urls.length > 0 ? Math.min(index, urls.length - 1) : 0;
  const current = urls[safeIndex] ?? null;

  return (
    <>
      <Sheet
        open={Boolean(product)}
        onClose={onClose}
        title={product.name}
        footer={
          <div className="flex flex-col gap-2">
            <ProductSaveButton productId={product.id} />
            {selectable ? (
              <Button variant={selected ? 'secondary' : 'primary'} fullWidth onClick={onToggleSelect}>
                {selected ? 'Selected' : 'Select design'}
              </Button>
            ) : null}
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          {product.sku ? <p className="text-xs font-medium text-muted">SKU {product.sku}</p> : null}
          {current ? (
            <button
              type="button"
              className="block w-full overflow-hidden rounded-2xl bg-foam"
              onClick={() => setPhotoOpen(true)}
              aria-label="View photo"
            >
              <img
                src={current}
                alt=""
                className="max-h-[50vh] w-full object-contain"
              />
            </button>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-2xl bg-foam text-muted">
              No photos
            </div>
          )}
          <p className="text-sm font-semibold text-ink">{formatRate(product.rate, product.unit)}</p>
          {product.moq != null && product.moq > 0 ? (
            <p className="text-sm font-medium text-ink">Minimum order · {product.moq} pcs</p>
          ) : null}
          {product.description?.trim() ? (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Notes</p>
              <p className="whitespace-pre-wrap text-sm text-ink">{product.description.trim()}</p>
            </div>
          ) : null}
        </div>
      </Sheet>
      <PhotoViewer
        open={photoOpen && urls.length > 0}
        urls={urls}
        index={safeIndex}
        onIndex={onIndex}
        onClose={() => setPhotoOpen(false)}
      />
    </>
  );
}

function ProductSaveButton({ productId }: { productId: string }) {
  const save = useSaveToggle(
    { productId },
    {
      toastSaved: 'Bookmarked this design',
      toastRemoved: 'Removed design bookmark',
    },
  );
  return (
    <Button
      variant="secondary"
      fullWidth
      disabled={save.isPending}
      onClick={() => save.toggle()}
    >
      {save.isPending
        ? 'Updating…'
        : save.isSaved
          ? 'Design bookmarked'
          : 'Bookmark this design'}
    </Button>
  );
}

function SelectMark({ selected }: { selected: boolean }) {
  return (
    <span
      className={cx(
        'flex h-6 w-6 items-center justify-center rounded-full border',
        selected ? 'border-accent bg-accent text-white' : 'border-line bg-white/90 text-transparent',
      )}
    >
      <CheckIcon width={14} height={14} />
    </span>
  );
}
