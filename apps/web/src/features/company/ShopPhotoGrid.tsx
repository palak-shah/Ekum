import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { designBrowsePhotoClass } from '@/lib/designBrowseLayout';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { CatalogFeedPost } from '@/ui/cards';
import { DesignPhotoCarousel } from '@/ui/DesignPhotoCarousel';
import { cx } from '@/ui/kit';
import { LONG_PRESS_SURFACE_CLASS, isLongPressActivateSuppressed } from '@/ui/useLongPress';

const CARD =
  'overflow-hidden rounded-2xl border border-line bg-surface text-left';

export function ShopPhotoCell({
  src,
  images: imagesProp,
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
  /** All design photos — enables swipe when length > 1. */
  images?: string[] | null;
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
  const urls = (imagesProp?.length ? imagesProp : src ? [src] : [])
    .map((url) => toAbsoluteMediaUrl(url) || url)
    .filter(Boolean);
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
        images={urls}
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
    <div className={cx(CARD, selecting && selected && 'border-accent')}>
      <DesignPhotoCarousel
        urls={urls}
        name={label}
        photoClassName={designBrowsePhotoClass('grid')}
        placeholderClassName={designBrowsePhotoClass('grid', 'placeholder')}
        selectMode={selectMode}
        selected={selected}
        onActivate={() => onActivate()}
        onLongSelect={onLongSelect}
        testId={testId ?? 'shop-design-photos'}
      />
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
