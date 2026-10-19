import { Link, useNavigate } from 'react-router-dom';
import type { BroadcastListView } from '@ekum/domain-types';
import {
  collectionListingCaption,
  type CollectionSummaryInput,
} from '@/features/catalog/collectionStatusSummary';
import { collectionOwnerSourceLine } from '@/features/catalog/collectionOwnerSourceLine';
import { displayCollectionName } from '@/features/catalog/collectionCreateHelpers';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { packFeedDetailLine } from '@/ui/albumMosaic';
import { AlbumGrid, CatalogFeedPost } from '@/ui/cards';
import { cx } from '@/ui/kit';
import { SelectableMediaFrame } from '@/ui/selectMediaChrome';
import {
  LONG_PRESS_SURFACE_CLASS,
  isLongPressActivateSuppressed,
  useLongPress,
} from '@/ui/useLongPress';
import {
  collectionAlbumMosaicCount,
  collectionAlbumOpenTarget,
  type CollectionAlbumSurface,
} from './collectionAlbumTileModel';

const CARD = 'overflow-hidden rounded-2xl border border-line bg-surface text-left';

export type CollectionAlbumTileProps = {
  surface: CollectionAlbumSurface;
  id: string;
  name: string;
  previewImages: string[];
  categories?: string[];
  layout: 'feed' | 'grid';
  selecting?: boolean;
  selected?: boolean;
  onToggle?: () => void;
  onLongSelect?: () => void;
  /** Shelf: own shop → manage dock on open. */
  packManage?: boolean;
  /** Library-only extras. */
  status?: string;
  productCount?: number;
  companyId?: string;
  memberShops?: { id: string; name: string }[];
  groups?: BroadcastListView[];
  audience?: string;
  audienceCompanyIds?: string[];
  audienceGroupIds?: string[];
  startsAt?: string | null;
  endsAt?: string | null;
  mediaTestId?: string;
  openTestId?: string;
  sourceTestId?: string;
  captionTestId?: string;
};

/**
 * You + shop Collections tile — same mosaic/name chrome.
 * Library adds caption / mill source / mosaic +N / archived→edit / packManage.
 * Shelf never shows design count or listing date.
 */
export function CollectionAlbumTile({
  surface,
  id,
  name,
  previewImages,
  categories = [],
  layout,
  selecting = false,
  selected = false,
  onToggle,
  onLongSelect,
  packManage = false,
  status,
  productCount,
  companyId,
  memberShops = [],
  groups = [],
  audience,
  audienceCompanyIds,
  audienceGroupIds,
  startsAt,
  endsAt,
  mediaTestId,
  openTestId,
  sourceTestId = 'you-collection-source',
  captionTestId = 'you-collection-caption',
}: CollectionAlbumTileProps) {
  const navigate = useNavigate();
  const longPress = useLongPress(selecting ? undefined : onLongSelect);
  const images = previewImages
    .map((url) => toAbsoluteMediaUrl(url) || url)
    .filter(Boolean);
  const mosaicCount = collectionAlbumMosaicCount({
    surface,
    productCount,
    previewCount: images.length,
  });
  const { href, state: openState } = collectionAlbumOpenTarget({
    surface,
    id,
    status,
    packManage,
  });

  const summary: CollectionSummaryInput & { productCount: number } = {
    status: status ?? '',
    productCount: productCount ?? 0,
    audience,
    audienceCompanyIds,
    audienceGroupIds,
    startsAt,
    endsAt,
  };
  const caption = surface === 'library' ? collectionListingCaption(summary, groups) : '';
  const sourceLine =
    surface === 'library' && companyId
      ? collectionOwnerSourceLine(companyId, memberShops)
      : null;
  const title = displayCollectionName(name);
  const detail = packFeedDetailLine({ tags: categories });

  const open = () => {
    navigate(href, openState ? { state: openState } : undefined);
  };

  const onMediaClick = () => {
    if (isLongPressActivateSuppressed()) return;
    if (selecting) {
      onToggle?.();
      return;
    }
    open();
  };

  if (layout === 'feed') {
    return (
      <CatalogFeedPost
        name={title}
        source={sourceLine}
        meta={caption}
        detail={detail}
        href={href}
        linkState={openState}
        images={images}
        imageCount={mosaicCount}
        selected={selected}
        selectMode={selecting}
        onMediaClick={onMediaClick}
        onLongSelect={selecting ? undefined : onLongSelect}
        mediaTestId={mediaTestId}
        openTestId={openTestId}
      />
    );
  }

  const captionBlock = (
    <div className="flex min-w-0 flex-col gap-1 overflow-hidden p-3">
      <p className="truncate text-base font-emphasis text-ink">{title}</p>
      {sourceLine ? (
        <p
          className="truncate text-sm font-emphasis tracking-tight text-ink"
          data-testid={sourceTestId}
        >
          {sourceLine}
        </p>
      ) : null}
      {caption ? (
        <p className="line-clamp-2 text-xs text-muted" data-testid={captionTestId}>
          {caption}
        </p>
      ) : null}
    </div>
  );

  const mosaic = (
    <SelectableMediaFrame
      selectMode={selecting}
      selected={selected}
      checkClassName="right-2 top-2"
      idleCheckClassName="border-white bg-ink/30 text-transparent"
    >
      <AlbumGrid images={images} imageCount={mosaicCount} alt={title} />
    </SelectableMediaFrame>
  );

  /** Shelf keeps separate open link test id; library uses one card control. */
  if (openTestId) {
    return (
      <div className={CARD}>
        <button
          type="button"
          aria-label={selecting ? `Select ${title}` : title}
          data-testid={mediaTestId}
          className={cx('relative block w-full text-left', LONG_PRESS_SURFACE_CLASS)}
          onClick={onMediaClick}
          {...longPress}
        >
          {mosaic}
        </button>
        {selecting ? (
          <button type="button" className="w-full text-left" onClick={onToggle}>
            {captionBlock}
          </button>
        ) : (
          <Link to={href} state={openState} data-testid={openTestId} className="block text-left">
            {captionBlock}
          </Link>
        )}
      </div>
    );
  }

  const body = (
    <>
      <div className="relative">{mosaic}</div>
      {captionBlock}
    </>
  );

  if (selecting) {
    return (
      <button
        type="button"
        aria-label={`Select ${title}`}
        data-testid={mediaTestId}
        onClick={onToggle}
        className={cx(CARD, LONG_PRESS_SURFACE_CLASS)}
      >
        {body}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={title}
      data-testid={mediaTestId}
      className={cx(CARD, LONG_PRESS_SURFACE_CLASS)}
      onClick={open}
      {...longPress}
    >
      {body}
    </button>
  );
}
