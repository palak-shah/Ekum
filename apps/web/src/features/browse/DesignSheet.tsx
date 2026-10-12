import { useEffect, useState, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProductView } from '@ekum/domain-types';
import { addCartDesignsMany } from '@/features/browse/browseCart';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { designSheetShortlistEntry } from '@/features/browse/designSheetEntry';
import { designSheetMoreIds } from '@/features/browse/designSheetMoreIds';
import { DockIconButton } from '@/features/browse/BottomTradeDock';
import { SelectionMessageSheet } from '@/features/browse/SelectionMessageSheet';
import { selectionOwnShopVerbs } from '@/features/browse/selectionOwnShopVerbs';
import {
  collectionPackDetailSections,
  designSheetRateBand,
} from '@/features/collections/collectionViewerChrome';
import { DesignSheetPhotoCarousel } from '@/features/collections/DesignSheetPhotoCarousel';
import { PackDetailBlocks } from '@/features/collections/PackDetailBlocks';
import { useSaveToggle } from '@/features/saved/useSaveToggle';
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
  PencilIcon,
  TrashIcon,
} from '@/ui/icons';
import { Sheet, cx } from '@/ui/kit';

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
>;

/**
 * Shared design open sheet — photos + pack details + trade footer.
 * Bookmark / Edit / Remove / Delete live in ⋯ (not the footer).
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
  onEdit,
  onRemove,
  onDelete,
  removeBusy = false,
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
  onEdit?: () => void;
  onRemove?: () => void;
  onDelete?: () => void;
  removeBusy?: boolean;
  /** When set, Remove from this collection may appear in ⋯. */
  collectionId?: string | null;
  packStamp?: {
    collectionId: string;
    handlerName: string;
    path: string | null;
    allowForward: boolean;
  };
  testIdPrefix?: string;
}) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const me = useMyCompany();
  const [, startTransition] = useTransition();
  const [photoOpen, setPhotoOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);

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
  }, [product.id]);

  const urls = product.images;
  const safeIndex = urls.length > 0 ? Math.min(index, urls.length - 1) : 0;
  const curatedFrom = Boolean(shopLine?.startsWith('From '));
  const entry = designSheetShortlistEntry(
    product,
    product.companyName ?? '',
    packStamp ??
      (collectionId
        ? {
            collectionId,
            handlerName: product.companyName ?? '',
            path: null,
            allowForward: product.allowForward !== false,
          }
        : undefined),
  );
  const ownVerbs = selectionOwnShopVerbs({
    singleShopId: product.companyId,
    myCompanyId: me.data?.id,
  });
  const moreIds = designSheetMoreIds({
    canEdit: Boolean(canEdit && onEdit),
    canRemove: Boolean(canRemove && onRemove && collectionId),
    canDelete: Boolean(canDelete && onDelete),
  });

  const addToCart = () => {
    addCartDesignsMany([entry]);
    showToast('Added to cart', 'success');
  };

  const startOrder = () => {
    addCartDesignsMany([entry]);
    onClose();
    startTransition(() => navigate('/selection', { state: { openOrder: true } }));
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
    if (id === 'remove' && onRemove) {
      return [
        {
          id: 'remove',
          label: 'Remove from this collection',
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
                onClick={() => setShareOpen(true)}
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
                'border border-accent bg-accent text-sm font-bold text-white',
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
                curatedFrom ? 'font-semibold text-ink' : 'font-medium text-ink',
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
          <PackDetailBlocks
            testIdPrefix={testIdPrefix}
            sections={collectionPackDetailSections({
              categories: product.categories,
              description: product.description,
              rateBand: designSheetRateBand(
                formatCatalogRate({
                  rate: product.rate,
                  rateMax: product.rateMax,
                  unit: product.unit,
                  dispatchUnit: product.dispatchUnit,
                }),
              ),
            })}
          />
          {product.moq != null && product.moq > 0 ? (
            <p className="text-sm font-medium text-ink">Minimum order · {product.moq} pcs</p>
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
        products={[{ productId: product.id, name: product.name }]}
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
    </>
  );
}
