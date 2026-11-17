import { useNavigate } from 'react-router-dom';
import { ProductStatus } from '@ekum/domain-types';
import { libraryDesignMembershipLine } from '@/features/catalog/libraryPickerSource';
import { designBrowsePhotoClass, type DesignBrowseLayout } from '@/lib/designBrowseLayout';
import { CatalogFeedPost } from '@/ui/cards';
import { DraftChip } from '@/ui/DraftChip';
import { highlightSearchText } from '@/ui/highlightMatch';
import { DesignPhotoCarousel } from '@/ui/DesignPhotoCarousel';
import { cx } from '@/ui/kit';
import { LONG_PRESS_SURFACE_CLASS, useLongPress } from '@/ui/useLongPress';

export type SellerProductTileProduct = {
  id: string;
  name: string;
  images: string[];
  status?: string;
  collectionNames?: string[] | null;
};

export function SellerProductTile({
  product,
  highlightQuery = '',
  variant,
  selecting,
  selected,
  onToggle,
  onLongSelect,
  onOpenPublished,
  testId = 'catalog-product-tile',
}: {
  product: SellerProductTileProduct;
  highlightQuery?: string;
  variant: DesignBrowseLayout;
  selecting: boolean;
  selected: boolean;
  onToggle: () => void;
  onLongSelect: () => void;
  onOpenPublished: () => void;
  testId?: string;
}) {
  const navigate = useNavigate();
  const longPress = useLongPress(selecting ? undefined : onLongSelect);
  const feed = variant === 'feed';
  const membership = libraryDesignMembershipLine(product.collectionNames);
  const status = product.status;
  const open = () => {
    if (selecting) {
      onToggle();
      return;
    }
    if (status === ProductStatus.Published || !status) {
      onOpenPublished();
      return;
    }
    navigate(`/catalog/products/${product.id}`);
  };
  if (feed) {
    const live = status === ProductStatus.Published || !status;
    return (
      <CatalogFeedPost
        name={product.name}
        meta={membership ?? undefined}
        highlightQuery={highlightQuery}
        href={live ? undefined : `/catalog/products/${product.id}`}
        onOpen={live ? () => open() : undefined}
        images={product.images}
        imageCount={1}
        selected={selected}
        selectMode={selecting}
        onMediaClick={() => open()}
        onLongSelect={selecting ? undefined : onLongSelect}
        mediaTestId={testId}
        draft={status === ProductStatus.Draft}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface text-left" data-testid={testId}>
      <DesignPhotoCarousel
        urls={product.images}
        name={product.name}
        photoClassName={designBrowsePhotoClass(variant)}
        placeholderClassName={designBrowsePhotoClass(variant, 'placeholder')}
        selectMode={selecting}
        selected={selected}
        onActivate={() => open()}
        onLongSelect={selecting ? undefined : onLongSelect}
        testId="catalog-product-photos"
      />
      <button
        type="button"
        onClick={open}
        className={cx(
          'flex w-full min-w-0 flex-col gap-1 overflow-hidden text-left',
          feed ? 'p-3' : 'p-2.5',
          LONG_PRESS_SURFACE_CLASS,
        )}
        {...longPress}
      >
        <p className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-emphasis text-ink">
            {highlightSearchText(product.name, highlightQuery)}
          </span>
          {status === ProductStatus.Draft ? (
            <DraftChip testId="catalog-product-draft-chip" />
          ) : null}
        </p>
        {membership ? (
          <p className="truncate text-xs font-body text-muted">{membership}</p>
        ) : null}
      </button>
    </div>
  );
}
