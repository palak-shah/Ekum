import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CollectionCard } from '@ekum/domain-types';
import { designBrowsePhotoClass } from '@/lib/designBrowseLayout';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { AlbumGrid, CatalogFeedPost, explorePostedWhen } from '@/ui/cards';
import { packFeedDetailLine } from '@/ui/albumMosaic';
import { cx } from '@/ui/kit';
import { SelectableMediaFrame } from '@/ui/selectMediaChrome';
import { LONG_PRESS_SURFACE_CLASS, isLongPressActivateSuppressed, useLongPress } from '@/ui/useLongPress';
import { shopCollectionPreviewImages } from './shopPhoto';

const CARD =
  'overflow-hidden rounded-2xl border border-line bg-surface text-left';

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

  return (
    <div className={CARD}>
      <button
        type="button"
        aria-label={selecting ? `Select ${label}` : label}
        data-testid={testId}
        className={cx('relative block w-full text-left', LONG_PRESS_SURFACE_CLASS)}
        onClick={onActivate}
        {...longPress}
      >
        <SelectableMediaFrame
          selectMode={selectMode}
          selected={selected}
          checkClassName="right-2 top-2"
          idleCheckClassName="border-white bg-ink/30 text-transparent"
        >
          {url ? (
            <img src={url} alt="" className={designBrowsePhotoClass('grid')} loading="lazy" />
          ) : (
            <div className={designBrowsePhotoClass('grid', 'placeholder')}>
              {label.trim().charAt(0).toUpperCase() || '·'}
            </div>
          )}
        </SelectableMediaFrame>
      </button>
      {showName ? (
        to ? (
          <Link
            to={to}
            data-testid={testId ? `${testId}-open` : undefined}
            className="block truncate p-2.5 text-sm font-medium text-ink"
          >
            {label}
          </Link>
        ) : (
          <span className="block truncate p-2.5 text-sm font-medium text-ink">{label}</span>
        )
      ) : null}
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
  const href = `/collections/${collection.id}`;

  const onMosaic = () => {
    if (isLongPressActivateSuppressed()) return;
    if (selecting) {
      onToggleSelect?.();
      return;
    }
    navigate(href);
  };
  if (layout === 'feed') {
    return (
      <CatalogFeedPost
        name={collection.name}
        meta={explorePostedWhen(collection.updatedAt) ?? ''}
        detail={packFeedDetailLine({ tags: collection.categories })}
        href={href}
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
    <div className={CARD}>
      <button
        type="button"
        aria-label={selecting ? `Select ${collection.name}` : collection.name}
        data-testid={`company-shop-collection-${collection.id}`}
        className={cx('relative block w-full text-left', LONG_PRESS_SURFACE_CLASS)}
        onClick={onMosaic}
        {...longPress}
      >
        <SelectableMediaFrame
          selectMode={selectMode}
          selected={selected}
          checkClassName="right-2 top-2"
          idleCheckClassName="border-white bg-ink/30 text-transparent"
        >
          <AlbumGrid
            images={images.map((url) => toAbsoluteMediaUrl(url)).filter(Boolean)}
            imageCount={mosaicCount}
            alt={collection.name}
          />
        </SelectableMediaFrame>
      </button>
      <Link
        to={href}
        data-testid={`company-shop-collection-open-${collection.id}`}
        className="flex min-w-0 flex-col gap-0.5 overflow-hidden p-3"
      >
        <span className="truncate text-base font-semibold text-ink">{collection.name}</span>
        {explorePostedWhen(collection.updatedAt) ? (
          <span className="truncate text-xs text-muted">
            {explorePostedWhen(collection.updatedAt)}
          </span>
        ) : null}
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
      className={cx(layout === 'feed' ? 'flex flex-col' : 'grid grid-cols-2 gap-3')}
      data-testid="company-shop-grid"
      data-layout={layout}
    >
      {children}
    </div>
  );
}
