import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  OrderIntent,
  OrderKind,
  ProductStatus,
  type CreateOrdersBatchResult,
  type ProductView,
} from '@ekum/domain-types';
import { addCartDesignsMany } from '@/features/browse/browseCart';
import {
  SELECTION_NEEDS_PUBLISHED_TOAST,
  isTradeableShortlistStatus,
} from '@/features/browse/selectionEligibility';
import { BulkProductPublishSheet } from '@/features/catalog/BulkProductPublishSheet';
import { invalidateAfterPackMembership } from '@/features/catalog/packMembershipInvalidate';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { designSheetShortlistEntry } from '@/features/browse/designSheetEntry';
import type { BrowseShortlistEntry } from '@/features/browse/browseShortlist';
import { usePrepareCatalogOrder } from '@/features/browse/usePrepareCatalogOrder';
import { designSheetMoreIds } from '@/features/browse/designSheetMoreIds';
import {
  addToPackActionLabel,
  type AddToPackLabelSurface,
} from '@/features/catalog/libraryPickerSource';
import { DockIconButton } from '@/features/browse/BottomTradeDock';
import { SelectionMessageSheet } from '@/features/browse/SelectionMessageSheet';
import { selectionOwnShopVerbs } from '@/features/browse/selectionOwnShopVerbs';
import { entriesAsProducts } from '@/features/browse/useShortlistOrderFlow';
import {
  designSheetUnderPhoto,
  type DesignSheetUnderPhoto,
} from '@/features/collections/collectionViewerChrome';
import { DesignSheetPhotoCarousel } from '@/features/collections/DesignSheetPhotoCarousel';
import { batchConfirmTitle, batchSuccessLeave } from '@/features/orders/BatchOrderConfirmSheet';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import { navigateToOrderChat } from '@/features/orders/navigateToOrderChat';
import { placeNoteAttachFields } from '@/features/orders/placeNoteAttach';
import { useSaveToggle } from '@/features/saved/useSaveToggle';
import { api, ApiError } from '@/lib/apiClient';
import { formatCatalogRate } from '@/lib/catalogRate';
import { useMyCompany } from '@/lib/queries';
import { listSquareButtonClass } from '@/ui/ListSearchRow';
import { MoreActionsSheet, type MoreActionItem } from '@/ui/MoreActionsSheet';
import { PhotoViewer } from '@/ui/PhotoViewer';
import { useToast } from '@/ui/Toast';
import {
  BookmarkIcon,
  CartIcon,
  ChatIcon,
  MoreHorizontalIcon,
  PaperPlaneIcon,
  CollectionIcon,
  MegaphoneIcon,
  PencilIcon,
  TrashIcon,
} from '@/ui/icons';
import { Sheet, Tag, cx } from '@/ui/kit';

export type DesignSheetProduct = Pick<
  ProductView,
  | 'id'
  | 'name'
  | 'images'
  | 'companyId'
  | 'companyName'
  | 'allowForward'
  | 'categories'
  | 'description'
  | 'unit'
  | 'dispatchUnit'
  | 'moq'
  | 'rate'
  | 'rateMax'
  | 'status'
> & {
  piecesPerPack?: number | null;
  catalogCollectionId?: string | null;
  catalogOrderMode?: string | null;
  collectionNames?: string[] | null;
};

/**
 * Shared design open sheet — photos + pack details + trade footer.
 * Bookmark / Edit / Publish / Remove / Delete live in ⋯ (not the footer).
 */
export function DesignSheet({
  product,
  shopLine = null,
  index,
  onIndex,
  onClose,
  canEdit = false,
  canRemove = false,
  canDelete = false,
  canAddToPack = false,
  addToPackSurface = 'album',
  onEdit,
  onRemove,
  onDelete,
  onAddToPack,
  removeBusy = false,
  removeLabel = 'Remove from this collection',
  collectionId,
  packStamp,
  testIdPrefix = 'design-sheet',
}: {
  product: DesignSheetProduct;
  shopLine?: string | null;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  canEdit?: boolean;
  canRemove?: boolean;
  canDelete?: boolean;
  canAddToPack?: boolean;
  addToPackSurface?: AddToPackLabelSurface;
  onEdit?: () => void;
  onRemove?: () => void;
  onDelete?: () => void;
  onAddToPack?: () => void;
  removeBusy?: boolean;
  removeLabel?: string;
  /** When set, Remove from this collection may appear in ⋯. */
  collectionId?: string | null;
  packStamp?: {
    collectionId: string;
    handlerName: string;
    handlerCompanyId?: string;
    path: string | null;
    allowForward: boolean;
    sourceDirect?: boolean;
  };
  testIdPrefix?: string;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const me = useMyCompany();
  const [photoOpen, setPhotoOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [qtyOpen, setQtyOpen] = useState(false);
  const [orderEntries, setOrderEntries] = useState<BrowseShortlistEntry[] | null>(null);
  const [lockedProductIds, setLockedProductIds] = useState<string[]>([]);
  const { prepare: prepareCatalogOrder } = usePrepareCatalogOrder();
  const [publishOpen, setPublishOpen] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const save = useSaveToggle(
    { productId: product.id },
    {
      toastSaved: 'Bookmarked this design',
      toastRemoved: 'Removed design bookmark',
    },
  );

  useEffect(() => {
    setPhotoOpen(false);
    setMoreOpen(false);
    setShareOpen(false);
    setMessageOpen(false);
    setQtyOpen(false);
    setPublishOpen(false);
    setOrderError(null);
    setOrderEntries(null);
    setLockedProductIds([]);
  }, [product.id]);

  const urls = product.images;
  const safeIndex = urls.length > 0 ? Math.min(index, urls.length - 1) : 0;
  const curatedFrom = Boolean(shopLine?.startsWith('From '));
  const entry = designSheetShortlistEntry(
    { ...product, piecesPerPack: product.piecesPerPack ?? null },
    product.companyName ?? '',
    packStamp ??
      (collectionId
        ? {
            collectionId,
            handlerName: product.companyName ?? '',
            handlerCompanyId: product.companyId,
            path: null,
            allowForward: product.allowForward !== false,
          }
        : undefined),
  );
  const ownVerbs = selectionOwnShopVerbs({
    singleShopId: product.companyId,
    myCompanyId: me.data?.id,
  });
  const canPublish = Boolean(canEdit && product.status === ProductStatus.Draft);
  const moreIds = designSheetMoreIds({
    canEdit: Boolean(canEdit && onEdit),
    canPublish,
    canRemove: Boolean(canRemove && onRemove && collectionId),
    canDelete: Boolean(canDelete && onDelete),
    canAddToPack: Boolean(canAddToPack && onAddToPack),
  });

  const publishInPack = useMutation({
    mutationFn: () =>
      api.post<{ published: number }>(`/collections/${collectionId}/publish-members`, {
        productIds: [product.id],
      }),
    onSuccess: () => {
      void invalidateAfterPackMembership(queryClient);
      showToast('Published');
      onClose();
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not publish.', 'danger');
    },
  });

  const placeOrder = useMutation({
    mutationFn: (input: {
      lines: Array<{ productId: string; quantity: number; note?: string }>;
      transporter?: string;
      note?: string;
      noteVoiceMediaId?: string;
      noteVoiceDurationMs?: number;
      noteImageUrls?: string[];
    }) =>
      api.post<CreateOrdersBatchResult>('/orders/batch', {
        kind: OrderKind.Standard,
        intent: OrderIntent.Order,
        ...(input.transporter?.trim() ? { transporter: input.transporter.trim() } : {}),
        ...placeNoteAttachFields(input),
        items: input.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          images: [],
          ...(line.note?.trim() ? { note: line.note.trim() } : {}),
        })),
      }),
    onSuccess: (payload) => {
      setQtyOpen(false);
      setOrderError(null);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      showToast(
        batchConfirmTitle(payload),
        payload.orders.length === 0 ? 'danger' : 'success',
      );
      const leave = batchSuccessLeave(payload);
      if (leave?.kind === 'order') {
        onClose();
        void navigateToOrderChat(navigate, queryClient, leave.order, { replace: true });
      }
    },
    onError: (error) =>
      setOrderError(error instanceof ApiError ? error.message : 'Could not place the order.'),
  });

  const addToCart = () => {
    if (!isTradeableShortlistStatus(product.status)) {
      showToast(SELECTION_NEEDS_PUBLISHED_TOAST);
      return;
    }
    addCartDesignsMany([entry]);
    showToast('Added to cart', 'success');
  };

  const startOrder = () => {
    if (!isTradeableShortlistStatus(product.status)) {
      showToast(SELECTION_NEEDS_PUBLISHED_TOAST);
      return;
    }
    setOrderError(null);
    void (async () => {
      const prepared = await prepareCatalogOrder({
        albums: [],
        shortlist: [entry],
        quiet: true,
      });
      if (prepared.kind === 'error') return;
      setLockedProductIds(prepared.lockedProductIds);
      setOrderEntries(prepared.shortlist);
      setQtyOpen(true);
    })();
  };

  const moreItems: MoreActionItem[] = moreIds.flatMap((id): MoreActionItem[] => {
    if (id === 'bookmark') {
      return [
        {
          id: 'bookmark',
          label: save.isPending
            ? 'Updating…'
            : save.isSaved
              ? 'Design bookmarked'
              : 'Bookmark this design',
          icon: <BookmarkIcon width={20} height={20} />,
          disabled: save.isPending || !product.id,
          onClick: () => {
            setMoreOpen(false);
            void save.toggle();
          },
          testId: `${testIdPrefix}-bookmark`,
        },
      ];
    }
    if (id === 'edit' && onEdit) {
      return [
        {
          id: 'edit',
          label: 'Edit design',
          icon: <PencilIcon width={20} height={20} />,
          onClick: () => {
            setMoreOpen(false);
            onEdit();
          },
          testId: `${testIdPrefix}-edit`,
        },
      ];
    }
    if (id === 'publish') {
      return [
        {
          id: 'publish',
          label: 'Publish',
          icon: <MegaphoneIcon width={20} height={20} />,
          disabled: publishInPack.isPending,
          onClick: () => {
            setMoreOpen(false);
            if (collectionId) {
              publishInPack.mutate();
              return;
            }
            setPublishOpen(true);
          },
          testId: `${testIdPrefix}-publish`,
        },
      ];
    }
    if (id === 'addToPack' && onAddToPack) {
      return [
        {
          id: 'add-to-pack',
          label: addToPackActionLabel([product], addToPackSurface),
          icon: <CollectionIcon width={20} height={20} />,
          onClick: () => {
            setMoreOpen(false);
            onAddToPack();
          },
          testId: `${testIdPrefix}-add-to-pack`,
        },
      ];
    }
    if (id === 'remove' && onRemove) {
      return [
        {
          id: 'remove',
          label: removeLabel,
          icon: <TrashIcon width={20} height={20} />,
          disabled: removeBusy,
          onClick: () => {
            setMoreOpen(false);
            onRemove();
          },
          testId: `${testIdPrefix}-remove`,
        },
      ];
    }
    if (id === 'delete' && onDelete) {
      return [
        {
          id: 'delete',
          label: 'Delete design',
          icon: <TrashIcon width={20} height={20} />,
          danger: true,
          disabled: removeBusy,
          onClick: () => {
            setMoreOpen(false);
            onDelete();
          },
          testId: `${testIdPrefix}-delete`,
        },
      ];
    }
    return [];
  });

  return (
    <>
      <Sheet
        open
        onClose={onClose}
        title={product.name}
        headerAction={
          <button
            type="button"
            aria-label="More"
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            data-testid={`${testIdPrefix}-more`}
            onClick={() => setMoreOpen(true)}
            className={cx(listSquareButtonClass, 'text-slate')}
          >
            <MoreHorizontalIcon width={20} height={20} />
          </button>
        }
        footer={
          <div
            className="flex items-stretch gap-2"
            data-testid={`${testIdPrefix}-trade`}
          >
            <div className="grid min-w-0 flex-1 grid-cols-3 gap-1.5">
              <DockIconButton
                testId={`${testIdPrefix}-cart`}
                label="Add to cart"
                onClick={addToCart}
              >
                <CartIcon width={22} height={22} />
              </DockIconButton>
              <DockIconButton
                testId={`${testIdPrefix}-message`}
                label="Message"
                disabled={ownVerbs.messageDisabled}
                onClick={() => setMessageOpen(true)}
              >
                <ChatIcon width={22} height={22} />
              </DockIconButton>
              <DockIconButton
                testId={`${testIdPrefix}-share`}
                label="Share"
                onClick={() => {
                  if (!isTradeableShortlistStatus(product.status)) {
                    showToast(SELECTION_NEEDS_PUBLISHED_TOAST);
                    return;
                  }
                  setShareOpen(true);
                }}
              >
                <PaperPlaneIcon width={22} height={22} />
              </DockIconButton>
            </div>
            <button
              type="button"
              data-testid={`${testIdPrefix}-order`}
              onClick={startOrder}
              className={cx(
                'flex min-h-12 min-w-[5.75rem] shrink-0 items-center justify-center rounded-xl px-3',
                'border border-accent bg-accent text-sm font-emphasis text-on-accent',
              )}
            >
              {ownVerbs.orderLabel}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3" data-testid={testIdPrefix}>
          {shopLine ? (
            <p
              className={cx(
                'text-sm',
                curatedFrom ? 'font-emphasis text-ink' : 'font-emphasis text-ink',
              )}
              data-testid={curatedFrom ? `${testIdPrefix}-from` : undefined}
            >
              {shopLine}
            </p>
          ) : null}
          <DesignSheetPhotoCarousel
            urls={urls}
            index={safeIndex}
            onIndex={onIndex}
            onOpenFullscreen={() => setPhotoOpen(true)}
          />
          <DesignSheetUnderPhotoBlock
            testIdPrefix={testIdPrefix}
            facts={designSheetUnderPhoto({
              categories: product.categories,
              description: product.description,
              rateLabel: formatCatalogRate({
                rate: product.rate,
                rateMax: product.rateMax,
                unit: product.unit,
                dispatchUnit: product.dispatchUnit,
              }),
            })}
          />
          {product.moq != null && product.moq > 0 ? (
            <p className="text-sm font-emphasis text-ink">Minimum order · {product.moq} pcs</p>
          ) : null}
        </div>
      </Sheet>
      <MoreActionsSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title={product.name}
        testId={`${testIdPrefix}-more-sheet`}
        items={moreItems}
      />
      <SelectionMessageSheet
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        shopId={product.companyId}
        shopName={product.companyName ?? ''}
        collections={[]}
        products={[
          {
            productId: product.id,
            name: product.name,
            image: product.images[0] ?? null,
          },
        ]}
      />
      <CatalogShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        collections={[]}
        products={[
          {
            productId: product.id,
            name: product.name,
            image: product.images[0] ?? null,
          },
        ]}
      />
      <PhotoViewer
        open={photoOpen && urls.length > 0}
        urls={urls}
        index={safeIndex}
        onIndex={onIndex}
        onClose={() => setPhotoOpen(false)}
      />
      <HowManyEachSheet
        open={qtyOpen}
        onClose={() => {
          setQtyOpen(false);
          setOrderError(null);
          setOrderEntries(null);
          setLockedProductIds([]);
        }}
        sellerId={packStamp?.handlerCompanyId || product.companyId}
        products={entriesAsProducts(orderEntries ?? [entry])}
        lockedProductIds={lockedProductIds}
        submitting={placeOrder.isPending}
        error={orderError}
        orderGoesToName={
          packStamp?.handlerName?.trim() || product.companyName || undefined
        }
        collectionId={packStamp?.collectionId ?? collectionId ?? undefined}
        sheetJob="order"
        onSendOrder={(lines, place) => {
          setOrderError(null);
          placeOrder.mutate({ lines, ...place });
        }}
        onAskRates={() => undefined}
      />
      <BulkProductPublishSheet
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        productIds={canPublish ? [product.id] : []}
        onDone={() => {
          void invalidateAfterPackMembership(queryClient);
        }}
      />
    </>
  );
}

/** Tags on the left, rate on the right, description underneath. */
function DesignSheetUnderPhotoBlock({
  facts,
  testIdPrefix,
}: {
  facts: DesignSheetUnderPhoto;
  testIdPrefix: string;
}) {
  const tags = facts.tags;
  if (tags.length === 0 && !facts.rate && !facts.description) return null;
  return (
    <div className="flex flex-col gap-2" data-testid={`${testIdPrefix}-under-photo`}>
      {tags.length > 0 || facts.rate ? (
        <div className="flex items-start gap-3">
          <div
            className="flex min-w-0 flex-1 flex-wrap gap-1.5"
            data-testid={`${testIdPrefix}-item-tags`}
          >
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
          {facts.rate ? (
            <p
              className="shrink-0 text-sm font-emphasis text-ink"
              data-testid={`${testIdPrefix}-rate`}
            >
              {facts.rate}
            </p>
          ) : null}
        </div>
      ) : null}
      {facts.description ? (
        <p
          className="whitespace-pre-wrap text-sm text-muted"
          data-testid={`${testIdPrefix}-description`}
        >
          {facts.description}
        </p>
      ) : null}
    </div>
  );
}
