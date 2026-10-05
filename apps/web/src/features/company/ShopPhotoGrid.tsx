import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CollectionCard } from '@ekum/domain-types';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { AlbumGrid, CatalogFeedPost, explorePostedWhen } from '@/ui/cards';
import { packFeedDetailLine } from '@/ui/albumMosaic';
import { cx } from '@/ui/kit';
import { SelectableMediaFrame } from '@/ui/selectMediaChrome';
import { LONG_PRESS_SURFACE_CLASS, isLongPressActivateSuppressed, useLongPress } from '@/ui/useLongPress';
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
  layout = 'grid',
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
  layout?: 'feed' | 'grid';
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
  if (layout === 'feed') {
    return (
      <CatalogFeedPost
        name={label}
        href={to ?? '#'}
        images={url ? [url] : []}
        imageCount={1}
        selected={selected}
        selectMode={selectMode}
        onMediaClick={onActivate}
        onLongSelect={onLongSelect}
        mediaTestId={testId}
        openTestId={testId ? `${testId}-open` : undefined}
      />
    );
  }

  const photo = (
    <button
      type="button"
      aria-label={selecting ? `Select ${label}` : label}
      data-testid={testId}
      className={cx('relative aspect-square overflow-hidden bg-linen text-left', LONG_PRESS_SURFACE_CLASS)}
      onClick={onActivate}
      {...longPress}
    >
      <SelectableMediaFrame
        selectMode={selectMode}
        selected={selected}
        idleCheckClassName="border-white/80 bg-black/20 text-transparent"
      >
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-linen text-lg font-bold text-muted">
            {label.trim().charAt(0).toUpperCase() || '·'}
          </span>
        )}
      </SelectableMediaFrame>
    </button>
  );

  if (!showName) {
    return <div className="bg-surface">{photo}</div>;
  }

  return (
    <div className="flex flex-col bg-surface text-left">
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
  layout = 'grid',
}: {
  collection: CollectionCard;
  selected?: boolean;
  selectMode?: boolean;
  onLongSelect?: () => void;
  onToggleSelect?: () => void;
  layout?: 'feed' | 'grid';
}) {
  const navigate = useNavigate();
  const longPress = useLongPress(onLongSelect);
  const selecting = Boolean(selectMode && onToggleSelect);
  const images = shopCollectionPreviewImages(collection);
  /** Preview thumbs only — do not size mosaic from productCount (leaks inventory). */
  const mosaicCount = images.length;

  const onMosaic = () => {
    if (isLongPressActivateSuppressed()) return;
    if (selecting) {
      onToggleSelect?.();
      return;
    }
    navigate(`/collections/${collection.id}`);
  };
  if (layout === 'feed') {
    return (
      <CatalogFeedPost
        name={collection.name}
        meta={explorePostedWhen(collection.updatedAt) ?? ''}
        detail={packFeedDetailLine({ tags: collection.categories })}
        href={`/collections/${collection.id}`}
        images={images.map((url) => toAbsoluteMediaUrl(url)).filter((url): url is string => Boolean(url))}
        imageCount={mosaicCount}
        selected={selected}
        selectMode={selectMode}
        onMediaClick={onMosaic}
        onLongSelect={onLongSelect}
        mediaTestId={`company-shop-collection-${collection.id}`}
        openTestId={`company-shop-collection-open-${collection.id}`}
      />
    );
  }

  return (
    <div className="flex flex-col bg-surface">
      <button
        type="button"
        aria-label={selecting ? `Select ${collection.name}` : collection.name}
        data-testid={`company-shop-collection-${collection.id}`}
        className={cx('relative aspect-square overflow-hidden bg-linen p-1 text-left', LONG_PRESS_SURFACE_CLASS)}
        onClick={onMosaic}
        {...longPress}
      >
        <SelectableMediaFrame
          selectMode={selectMode}
          selected={selected}
          idleCheckClassName="border-white/80 bg-black/20 text-transparent"
        >
          <AlbumGrid
            images={images.map((url) => toAbsoluteMediaUrl(url)).filter(Boolean)}
            imageCount={mosaicCount}
            alt={collection.name}
          />
        </SelectableMediaFrame>
      </button>
      <Link
        to={`/collections/${collection.id}`}
        data-testid={`company-shop-collection-open-${collection.id}`}
        className="px-2 pb-1.5 pt-1.5"
      >
        <span className="block truncate text-[13px] font-semibold tracking-tight text-ink">
          {collection.name}
        </span>
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
        layout === 'feed' ? 'flex flex-col' : '-mx-4 grid grid-cols-2 gap-px bg-line',
      )}
      data-testid="company-shop-grid"
      data-layout={layout}
    >
      {children}
    </div>
  );
}
