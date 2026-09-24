import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CollectionCard } from '@ekum/domain-types';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { AlbumGrid } from '@/ui/cards';
import { CheckIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';
import { LONG_PRESS_SURFACE_CLASS, isLongPressActivateSuppressed, useLongPress } from '@/ui/useLongPress';
import { collectionMosaicCount } from '@/ui/albumMosaic';
import { shopCollectionPreviewImages } from './shopPhoto';

export function ShopPhotoCell({
  src,
  label,
  to,
  selected = false,
  selectMode = false,
  onLongSelect,
  onToggleSelect,
  testId,
  showName = false,
}: {
  src: string | null;
  label: string;
  to?: string;
  selected?: boolean;
  selectMode?: boolean;
  onLongSelect?: () => void;
  onToggleSelect?: () => void;
  testId?: string;
  showName?: boolean;
}) {
  const navigate = useNavigate();
  const longPress = useLongPress(onLongSelect);
  const url = toAbsoluteMediaUrl(src);
  const selecting = Boolean(selectMode && onToggleSelect);

  const onActivate = () => {
    if (isLongPressActivateSuppressed()) return;
    if (selecting) {
      onToggleSelect?.();
      return;
    }
    if (to) navigate(to);
  };

  const photo = (
    <button
      type="button"
      aria-label={selecting ? `Select ${label}` : label}
      data-testid={testId}
      className={cx('relative aspect-square overflow-hidden bg-linen text-left', LONG_PRESS_SURFACE_CLASS)}
      onClick={onActivate}
      {...longPress}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-linen text-lg font-bold text-muted">
          {label.trim().charAt(0).toUpperCase() || '·'}
        </span>
      )}
      {selectMode ? (
        <span
          className={cx(
            'absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border text-white',
            selected ? 'border-accent bg-accent' : 'border-white/80 bg-black/20 text-transparent',
          )}
        >
          <CheckIcon width={14} height={14} />
        </span>
      ) : null}
    </button>
  );

  if (!showName) {
    return (
      <div className={cx('bg-surface', selecting && selected ? 'ring-2 ring-inset ring-accent' : '')}>
        {photo}
      </div>
    );
  }

  return (
    <div
      className={cx(
        'flex flex-col bg-surface text-left',
        selecting && selected ? 'ring-2 ring-inset ring-accent' : '',
      )}
    >
      {photo}
      {to ? (
        <Link
          to={to}
          data-testid={testId ? `${testId}-open` : undefined}
          className="truncate px-2 py-1.5 text-[13px] font-semibold tracking-tight text-ink"
        >
          {label}
        </Link>
      ) : (
        <span className="truncate px-2 py-1.5 text-[13px] font-semibold tracking-tight text-ink">
          {label}
        </span>
      )}
    </div>
  );
}

export function ShopCollectionCell({
  collection,
  selected = false,
  selectMode = false,
  onLongSelect,
  onToggleSelect,
}: {
  collection: CollectionCard;
  selected?: boolean;
  selectMode?: boolean;
  onLongSelect?: () => void;
  onToggleSelect?: () => void;
}) {
  const navigate = useNavigate();
  const longPress = useLongPress(onLongSelect);
  const selecting = Boolean(selectMode && onToggleSelect);
  const images = shopCollectionPreviewImages(collection);
  const countLabel =
    collection.productCount === 1 ? '1 design' : `${collection.productCount} designs`;

  const onMosaic = () => {
    if (isLongPressActivateSuppressed()) return;
    if (selecting) {
      onToggleSelect?.();
      return;
    }
    navigate(`/collections/${collection.id}`);
  };

  return (
    <div
      className={cx(
        'flex flex-col bg-surface',
        selecting && selected ? 'ring-2 ring-inset ring-accent' : '',
      )}
    >
      <button
        type="button"
        aria-label={selecting ? `Select ${collection.name}` : collection.name}
        data-testid={`company-shop-collection-${collection.id}`}
        className={cx('relative aspect-square overflow-hidden bg-linen p-1 text-left', LONG_PRESS_SURFACE_CLASS)}
        onClick={onMosaic}
        {...longPress}
      >
        <AlbumGrid
          images={images.map((url) => toAbsoluteMediaUrl(url)).filter(Boolean)}
          imageCount={collectionMosaicCount({
            productCount: collection.productCount,
            previewCount: images.length,
          })}
          alt={collection.name}
        />
        {selectMode ? (
          <span
            className={cx(
              'absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border text-white',
              selected ? 'border-accent bg-accent' : 'border-white/80 bg-black/20 text-transparent',
            )}
          >
            <CheckIcon width={14} height={14} />
          </span>
        ) : null}
      </button>
      <Link
        to={`/collections/${collection.id}`}
        data-testid={`company-shop-collection-open-${collection.id}`}
        className="px-2 pb-1.5 pt-1.5"
      >
        <span className="block truncate text-[13px] font-semibold tracking-tight text-ink">
          {collection.name}
        </span>
        <span className="block truncate text-[11px] font-medium text-muted">{countLabel}</span>
      </Link>
    </div>
  );
}

export function ShopPhotoGrid({
  children,
  layout = 'grid',
}: {
  children: ReactNode;
  layout?: 'feed' | 'grid';
}) {
  return (
    <div
      className={cx(
        '-mx-4 bg-line',
        layout === 'feed' ? 'flex flex-col gap-px' : 'grid grid-cols-2 gap-px',
      )}
      data-testid="company-shop-grid"
      data-layout={layout}
    >
      {children}
    </div>
  );
}
