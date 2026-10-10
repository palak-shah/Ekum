import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type {
  CollectionCard,
  CompanyCard,
  DiscoveryProductCard,
  ExploreBuyerOpportunity,
  ExploreDesignOpportunity,
  ExploreOpportunity,
  ExplorePost,
  ExploreProductCard,
  ExploreSupplierCard,
  ProductView,
  PublicCompanySummary,
} from '@ekum/domain-types';
import { formatCatalogRate } from '@/lib/catalogRate';
import { timeAgo } from '@/lib/format';
import { warmCompanyFromExplore } from '@/features/company/warmCompanyQueries';
import { Avatar, Chip, cx } from './kit';
import { ChevronRightIcon } from './icons';
import { GstTick, isGstVerified } from './GstTick';
import { shopIdentityLine, shopSellCategories } from './shopIdentity';
import { ExploreFeedCaption } from '@/features/explore/ExploreFeedCaption';
import { ExploreFeedActions } from '@/features/explore/ExploreFeedActions';
import {
  exploreFeedCategoryLine,
  exploreFeedNewDesignsLine,
  exploreFeedRateLine,
  exploreFeedSourceLine,
} from '@/features/explore/exploreFeedCaptionLines';
import { useMyCompany } from '@/lib/queries';
import {
  albumMediaAspectClass,
  albumOverflowLabel,
  collectionMosaicCount,
  designCountLabel,
} from './albumMosaic';
import { SelectableMediaFrame } from './selectMediaChrome';
import { LONG_PRESS_SURFACE_CLASS, isLongPressActivateSuppressed, useLongPress } from './useLongPress';

/** CoverImage IO prefetch — ahead of tall Explore cards. */
export const COVER_IMAGE_ROOT_MARGIN = '600px 0px';

/** Explore feed chrome — same tightness as Chats rows. */
export const EXPLORE_POST_ARTICLE_CLASS = '-mx-4 border-b border-line/70 pb-2.5';
export const EXPLORE_POST_INSET_CLASS = 'px-4';
/** Mosaic + pack name share the page gutter with the header (not under the avatar). */
export const EXPLORE_POST_MEDIA_INSET_CLASS = EXPLORE_POST_INSET_CLASS;
export const EXPLORE_POST_HEADER_CLASS = `flex items-center gap-2.5 ${EXPLORE_POST_INSET_CLASS} pt-2 pb-2.5`;
export const EXPLORE_POST_AVATAR = 36;

function ShopName({
  name,
  verification,
  className,
}: {
  name: string;
  verification: string;
  className?: string;
}) {
  return (
    <p className={cx('flex min-w-0 items-center gap-1', className)}>
      <span className="truncate">{name}</span>
      {isGstVerified(verification) ? <GstTick /> : null}
    </p>
  );
}

function ShopPostHeader({
  company,
  to,
  trailing,
  nameClassName = 'text-[15px] font-bold tracking-tight text-ink',
}: {
  company: PublicCompanySummary | CompanyCard | {
    id: string;
    name: string;
    city: string;
    logoUrl: string | null;
    verification: string;
    sellCategories?: string[];
    categories?: string[];
  };
  /** Omit on own Explore posts (“You”) — not a deep link to shop. */
  to?: string;
  trailing?: ReactNode;
  nameClassName?: string;
}) {
  const queryClient = useQueryClient();
  const identity = shopIdentityLine(company.city, shopSellCategories(company));
  const warm = () => warmCompanyFromExplore(queryClient, company.id);
  const identityBlock = (
    <>
      <ShopName name={company.name} verification={company.verification} className={nameClassName} />
      {identity ? <p className="truncate text-sm font-medium text-muted">{identity}</p> : null}
    </>
  );
  return (
    <div className={EXPLORE_POST_HEADER_CLASS}>
      {to ? (
        <Link to={to} className="shrink-0" onPointerDown={warm} onMouseEnter={warm}>
          <Avatar name={company.name} imageUrl={company.logoUrl} size={EXPLORE_POST_AVATAR} />
        </Link>
      ) : (
        <span className="shrink-0">
          <Avatar name={company.name} imageUrl={company.logoUrl} size={EXPLORE_POST_AVATAR} />
        </span>
      )}
      {to ? (
        <Link to={to} className="min-w-0 flex-1" onPointerDown={warm} onMouseEnter={warm}>
          {identityBlock}
        </Link>
      ) : (
        <div className="min-w-0 flex-1">{identityBlock}</div>
      )}
      {trailing}
    </div>
  );
}

export function CompanyRow({
  company,
  to,
  plain = false,
}: {
  company: PublicCompanySummary | CompanyCard;
  to?: string;
  /** Flat list row (Explore sections) instead of a padded card. */
  plain?: boolean;
}) {
  const subtitle = shopIdentityLine(company.city, shopSellCategories(company));
  const inner = (
    <div className="flex items-center gap-3">
      <Avatar name={company.name} imageUrl={company.logoUrl} size={plain ? 40 : undefined} />
      <div className="min-w-0 flex-1">
        <ShopName
          name={company.name}
          verification={company.verification}
          className="text-sm font-bold tracking-tight text-ink"
        />
        {subtitle ? <p className="truncate text-xs font-medium text-muted">{subtitle}</p> : null}
      </div>
      {to && !plain ? <ChevronRightIcon className="text-muted" /> : null}
    </div>
  );
  const className = plain
    ? 'block px-1 py-2.5 hover:bg-foam/50'
    : 'block rounded-2xl bg-surface p-3.5 hover:bg-foam/80';
  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

/** Company-primary Explore opportunity — collection evidence is secondary. */
export function OpportunityCollectionCard({
  opportunity,
  selected = false,
  selectMode = false,
  onLongSelect,
  onToggleSelect,
  onOpen,
  headerTrailing,
  priority = false,
}: {
  opportunity: ExploreOpportunity;
  selected?: boolean;
  selectMode?: boolean;
  onLongSelect?: () => void;
  onToggleSelect?: () => void;
  onOpen?: () => void;
  /** Follow control or other header trailing chrome (replaces posted time when set). */
  headerTrailing?: ReactNode;
  /** Above-the-fold Explore cards — load cover immediately. */
  priority?: boolean;
}) {
  const { collection } = opportunity;
  const company = collection.company;
  const when = postedWhen(collection.updatedAt);
  const me = useMyCompany();
  const isOwn = Boolean(me.data?.id && company.id === me.data.id);
  const navigate = useNavigate();
  const longPress = useLongPress(onLongSelect);
  const selecting = selectMode && onToggleSelect;
  const openAlbum = () => {
    onOpen?.();
    navigate(`/collections/${collection.id}`);
  };
  const onMediaClick = () => {
    if (isLongPressActivateSuppressed()) return;
    if (selecting) onToggleSelect();
    else openAlbum();
  };
  const rateLine = exploreFeedRateLine({
    rate: collection.rateMin,
    rateMax: collection.rateMax,
    unit: collection.rateUnit,
  });
  const categoryLine = exploreFeedCategoryLine(collection.categories);
  const sourceLine = !isOwn
    ? exploreFeedSourceLine(collection.sourceShopNames)
    : null;
  const newDesigns = exploreFeedNewDesignsLine({
    count: collection.exploreNewDesignCount,
    isOwn,
  });
  const meta = newDesigns
    ? [newDesigns, when].filter(Boolean).join(' · ')
    : [designCountLabel(collection.productCount), when].filter(Boolean).join(' · ');
  const detailLine = [sourceLine, categoryLine].filter(Boolean).join(' · ') || null;
  const headerCompany = isOwn
    ? { ...company, name: 'You' }
    : company;
  return (
    <article className={EXPLORE_POST_ARTICLE_CLASS}>
      <ShopPostHeader
        company={headerCompany}
        to={isOwn ? undefined : `/company/${company.id}`}
        trailing={isOwn ? undefined : headerTrailing}
      />
      <button
        type="button"
        aria-label={selecting ? `Select ${collection.name}` : collection.name}
        className={cx('relative block w-full text-left', EXPLORE_POST_MEDIA_INSET_CLASS, LONG_PRESS_SURFACE_CLASS)}
        onClick={onMediaClick}
        {...longPress}
      >
        <SelectableMediaFrame selectMode={selectMode} selected={selected}>
          <AlbumGrid
            images={collection.previewImages}
            imageCount={collectionMosaicCount({
              productCount: collection.productCount,
              previewCount: collection.previewImages.length,
            })}
            alt={collection.name}
            priority={priority}
          />
        </SelectableMediaFrame>
      </button>
      <div className={EXPLORE_POST_MEDIA_INSET_CLASS}>
        <ExploreFeedActions collection={collection} selecting={Boolean(selectMode)} />
      </div>
      <Link
        to={`/collections/${collection.id}`}
        data-testid={`explore-collection-open-${collection.id}`}
        className={cx('block w-full text-left', EXPLORE_POST_MEDIA_INSET_CLASS)}
        onClick={() => onOpen?.()}
      >
        <ExploreFeedCaption
          title={collection.name}
          meta={meta || designCountLabel(collection.productCount)}
          rateLine={rateLine}
          categoryLine={detailLine}
          about={collection.description}
        />
      </Link>
    </article>
  );
}

export function OpportunityCompanyRow({
  opportunity,
  plain = false,
}: {
  opportunity: ExploreBuyerOpportunity;
  plain?: boolean;
}) {
  return (
    <CompanyRow
      company={opportunity.company}
      to={`/company/${opportunity.company.id}`}
      plain={plain}
    />
  );
}

type BusinessCardModel = {
  company: CompanyCard;
  relevance: string | null;
  previewImages: string[];
  designCount: number;
  collectionCount: number;
  latestPostedAt?: string | null;
};

/** Relative time for Explore / library feed cards — “2d ago”, “just now”, or a short date. */
export function explorePostedWhen(iso: string | null | undefined): string {
  return postedWhen(iso);
}

/** Relative time for Explore cards — “2d ago”, “just now”, or a short date. */
function postedWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  const label = timeAgo(iso);
  if (!label) return '';
  if (label === 'just now') return label;
  if (/^\d+[mhd]$/.test(label)) return `${label} ago`;
  return label;
}

/**
 * Explore business row — match design/collection posts: header + shop mosaic when available.
 */
export function OpportunityBusinessCard({
  company,
  previewImages = [],
  designCount = 0,
  collectionCount = 0,
  latestPostedAt = null,
  intentSide = 'sell',
}: {
  company: BusinessCardModel['company'];
  relevance?: string | null;
  previewImages?: string[];
  designCount?: number;
  collectionCount?: number;
  latestPostedAt?: string | null;
  intentSide?: 'buy' | 'sell';
}) {
  const intentCats = (
    intentSide === 'buy' ? company.buyCategories : company.sellCategories
  ).filter(Boolean);
  const when = postedWhen(latestPostedAt);
  const previews = previewImages.filter(Boolean);
  const imageCount = Math.max(previews.length, designCount + collectionCount);
  const hasShopVisual = imageCount > 0;
  const shopTo = `/company/${company.id}`;

  const catalogLine = [
    designCount > 0 ? `${designCount} design${designCount === 1 ? '' : 's'}` : null,
    collectionCount > 0 ? `${collectionCount} album${collectionCount === 1 ? '' : 's'}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className={EXPLORE_POST_ARTICLE_CLASS}>
      <ShopPostHeader company={company} to={shopTo} />
      <Link to={shopTo} className={cx('block', EXPLORE_POST_MEDIA_INSET_CLASS)}>
        {hasShopVisual ? (
          <>
            <AlbumGrid images={previews} imageCount={imageCount} alt={company.name} />
            <div className="mt-1.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                {catalogLine ? (
                  <p className="text-sm font-semibold tracking-tight text-ink">{catalogLine}</p>
                ) : null}
                {when ? <p className="text-xs font-medium text-muted">{when}</p> : null}
                <BusinessIntentLine intentSide={intentSide} categories={intentCats} />
              </div>
              <span className="shrink-0 pt-0.5 text-xs font-bold text-accent">View shop →</span>
            </div>
          </>
        ) : (
          <BusinessIntentCard
            company={company}
            intentSide={intentSide}
            categories={intentCats}
          />
        )}
      </Link>
    </article>
  );
}

/** Compact grid tile for the Businesses directory — one cover, no collage count. */
export function BusinessShopTile({
  company,
  previewImages = [],
}: {
  company: BusinessCardModel['company'];
  relevance?: string | null;
  previewImages?: string[];
}) {
  const cover = previewImages[0] ?? null;
  const identity = shopIdentityLine(company.city, shopSellCategories(company));
  return (
    <Link
      to={`/company/${company.id}`}
      className="block overflow-hidden rounded-2xl border border-line bg-surface"
    >
      <div className="aspect-square overflow-hidden bg-foam">
        {cover ? (
          <CoverImage src={cover} alt={company.name} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Avatar name={company.name} imageUrl={company.logoUrl} size={56} />
          </div>
        )}
      </div>
      <div className="px-2.5 py-2.5">
        <ShopName
          name={company.name}
          verification={company.verification}
          className="text-sm font-semibold text-ink"
        />
        {identity ? <p className="truncate text-xs text-muted">{identity}</p> : null}
      </div>
    </Link>
  );
}

/** Compact intent line under a shop mosaic. */
function BusinessIntentLine({
  intentSide,
  categories,
}: {
  intentSide: 'buy' | 'sell';
  categories: string[];
}) {
  const cats = categories.slice(0, 3);
  const verb = intentSide === 'buy' ? 'Buys' : 'Sells';
  const line =
    cats.length > 0
      ? `${verb} ${cats.join(', ')}`
      : intentSide === 'buy'
        ? 'May want what you sell'
        : 'Supplier on Ekum';

  return <p className="mt-0.5 text-xs font-medium text-muted">{line}</p>;
}

/** Card for buyers/suppliers with no shop photos yet — chips, not a blank foam slab. */
function BusinessIntentCard({
  company,
  intentSide,
  categories,
}: {
  company: BusinessCardModel['company'];
  intentSide: 'buy' | 'sell';
  categories: string[];
}) {
  const cats = categories.slice(0, 4);
  const heading = intentSide === 'buy' ? 'Looking for' : 'Sells';

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5">
      <Avatar name={company.name} imageUrl={company.logoUrl} size={EXPLORE_POST_AVATAR} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{heading}</p>
        {cats.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cats.map((category) => (
              <Chip key={category} className="h-7 px-2.5 text-[11px]">
                {category}
              </Chip>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm font-semibold text-ink">
            {intentSide === 'buy' ? 'May want what you sell' : 'Browse their shop'}
          </p>
        )}
        <p className="mt-2 text-xs font-bold text-accent">View shop →</p>
      </div>
      <ChevronRightIcon width={18} height={18} className="shrink-0 text-muted" />
    </div>
  );
}

/** @deprecated Prefer OpportunityBusinessCard on Explore. */
export function SupplierDirectoryRow({ supplier }: { supplier: ExploreSupplierCard }) {
  return (
    <OpportunityBusinessCard
      company={supplier.company}
      relevance={supplier.relevance}
      previewImages={supplier.previewImages}
      designCount={supplier.designCount}
      collectionCount={supplier.collectionCount}
      latestPostedAt={supplier.latestPostedAt}
      intentSide="sell"
    />
  );
}

/** Company-primary Explore opportunity for a standalone design. */
export function OpportunityDesignCard({
  opportunity,
  selected = false,
  selectMode = false,
  onLongSelect,
  onToggleSelect,
  onOpen,
  headerTrailing,
  priority = false,
}: {
  opportunity: ExploreDesignOpportunity;
  selected?: boolean;
  selectMode?: boolean;
  onLongSelect?: () => void;
  onToggleSelect?: () => void;
  onOpen?: () => void;
  headerTrailing?: ReactNode;
  priority?: boolean;
}) {
  const { product } = opportunity;
  const company = product.company;
  const when = postedWhen(product.postedAt);
  const me = useMyCompany();
  const isOwn = Boolean(me.data?.id && company.id === me.data.id);
  const navigate = useNavigate();
  const longPress = useLongPress(onLongSelect);
  const selecting = selectMode && onToggleSelect;
  const openDesign = () => {
    onOpen?.();
    navigate(`/explore/products/${product.id}`);
  };
  const onMediaClick = () => {
    if (isLongPressActivateSuppressed()) return;
    if (selecting) onToggleSelect();
    else openDesign();
  };

  return (
    <article className={EXPLORE_POST_ARTICLE_CLASS}>
      <ShopPostHeader
        company={isOwn ? { ...company, name: 'You' } : company}
        to={isOwn ? undefined : `/company/${company.id}`}
        trailing={isOwn ? undefined : headerTrailing}
      />
      <button
        type="button"
        aria-label={selecting ? `Select ${product.name}` : product.name}
        className={cx('relative block w-full text-left', EXPLORE_POST_MEDIA_INSET_CLASS, LONG_PRESS_SURFACE_CLASS)}
        onClick={onMediaClick}
        {...longPress}
      >
        <SelectableMediaFrame selectMode={selectMode} selected={selected}>
          <AlbumGrid
            images={product.images[0] ? [product.images[0]] : []}
            imageCount={1}
            alt={product.name}
            priority={priority}
          />
        </SelectableMediaFrame>
      </button>
      <div className={EXPLORE_POST_MEDIA_INSET_CLASS}>
        <ExploreFeedActions product={product} selecting={Boolean(selectMode)} />
      </div>
      <Link
        to={`/explore/products/${product.id}`}
        data-testid={`explore-design-open-${product.id}`}
        className={cx('block w-full text-left', EXPLORE_POST_MEDIA_INSET_CLASS)}
        onClick={() => onOpen?.()}
      >
        <ExploreFeedCaption
          title={product.name}
          meta={[
            product.images.length > 1 ? `Design · ${product.images.length} photos` : 'Design',
            when,
          ]
            .filter(Boolean)
            .join(' · ')}
          rateLine={exploreFeedRateLine({
            rate: product.rate,
            rateMax: product.rateMax,
            unit: product.unit,
            dispatchUnit: product.dispatchUnit,
          })}
          categoryLine={exploreFeedCategoryLine(product.categories)}
        />
      </Link>
    </article>
  );
}

/** Shop / grid tile for a published design — fills the grid cell. */
export function DesignTile({
  product,
  selected = false,
  selectMode = false,
  onLongSelect,
  onToggleSelect,
}: {
  product: ExploreProductCard;
  selected?: boolean;
  selectMode?: boolean;
  onLongSelect?: () => void;
  onToggleSelect?: () => void;
}) {
  const longPress = useLongPress(onLongSelect);
  const navigate = useNavigate();
  const selecting = Boolean(selectMode && onToggleSelect);
  const openDesign = () => navigate(`/explore/products/${product.id}`);
  const onTileClick = () => {
    if (isLongPressActivateSuppressed()) return;
    if (selecting) onToggleSelect?.();
    else openDesign();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface text-left">
      <button
        type="button"
        className={cx('relative block w-full p-1.5 text-left', LONG_PRESS_SURFACE_CLASS)}
        onClick={onTileClick}
        {...longPress}
      >
        <SelectableMediaFrame selectMode={selectMode} selected={selected}>
          <AlbumGrid
            images={product.images}
            imageCount={product.images.length}
            alt={product.name}
          />
        </SelectableMediaFrame>
      </button>
      <Link
        to={`/explore/products/${product.id}`}
        data-testid={`explore-design-open-${product.id}`}
        className="block px-2.5 pb-2.5"
      >
        <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
        <p className="truncate text-xs text-muted">Design</p>
      </Link>
    </div>
  );
}

/**
 * Fills its parent; parent must set size + overflow-hidden.
 * Easy load: hold the network request until near the viewport (feed image storms
 * were hanging the local media server even with native loading=lazy).
 * `priority` skips IO defer for above-the-fold Explore cards.
 */
export function CoverImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [activeSrc, setActiveSrc] = useState<string | null>(priority ? src : null);

  useEffect(() => {
    if (!src) {
      setActiveSrc(null);
      return;
    }
    if (priority) {
      setActiveSrc(src);
      return;
    }
    const node = shellRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setActiveSrc(src);
      return;
    }
    let done = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (done) return;
        if (!entries.some((entry) => entry.isIntersecting)) return;
        done = true;
        setActiveSrc(src);
        io.disconnect();
      },
      { rootMargin: COVER_IMAGE_ROOT_MARGIN, threshold: 0.01 },
    );
    io.observe(node);
    return () => {
      done = true;
      io.disconnect();
    };
  }, [src, priority]);

  return (
    <div ref={shellRef} className={cx('h-full w-full', className)}>
      {activeSrc ? (
        <img
          src={activeSrc}
          alt={alt}
          className="h-full w-full object-cover object-center"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-foam text-2xl font-bold text-muted">
          {alt.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function CollectionTile({
  collection,
  showCompany = true,
}: {
  collection: CollectionCard;
  /** Hide on a company profile shop shelf where the seller is already known. */
  showCompany?: boolean;
}) {
  const images = collection.previewImages;
  return (
    <Link
      to={`/collections/${collection.id}`}
      className="block overflow-hidden rounded-2xl border border-line bg-surface"
    >
      <div className="p-1.5">
        <AlbumGrid
          images={images}
          imageCount={collectionMosaicCount({
            productCount: collection.productCount,
            previewCount: images.length,
          })}
          alt={collection.name}
        />
      </div>
      <div className="px-2.5 pb-2.5">
        <p className="truncate text-sm font-semibold text-ink">{collection.name}</p>
        {showCompany ? (
          <p className="truncate text-xs text-muted">{collection.company.name}</p>
        ) : null}
        <p className="truncate text-xs text-muted">
          {collection.productCount} design{collection.productCount === 1 ? '' : 's'}
        </p>
      </div>
    </Link>
  );
}

export function CollectionListItem({ collection }: { collection: CollectionCard }) {
  const cover = collection.previewImages[0] ?? null;
  return (
    <Link
      to={`/collections/${collection.id}`}
      className="flex items-center gap-3 overflow-hidden rounded-2xl bg-surface p-2.5 shadow-[var(--shadow-soft)]"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
        <CoverImage src={cover} alt={collection.name} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{collection.name}</p>
        <p className="truncate text-xs text-muted">{collection.company.name}</p>
        <p className="text-xs text-muted">{designCountLabel(collection.productCount)}</p>
      </div>
      <ChevronRightIcon className="shrink-0 text-muted" />
    </Link>
  );
}

/**
 * WhatsApp-style album mosaic: thin gutters, no blank cells.
 * 1 → square; 2 → two equal halves filling the square (no empty cell);
 * 3 → tall left + two stacked right;
 * 4+ → 2×2 with dark +N on the fourth cell (leftover after four thumbs).
 */
export function AlbumGrid({
  images,
  imageCount,
  alt,
  frame = 'square',
  priority = false,
}: {
  images: string[];
  imageCount: number;
  alt: string;
  /** `feed` = 4∶5 for one photo (light top/bottom crop). Mosaic stays square. */
  frame?: 'square' | 'feed';
  priority?: boolean;
}) {
  // Layout from available thumbs only — never invent empty cells from productCount.
  const count = images.length;
  const aspect = albumMediaAspectClass(count, frame);
  if (count <= 0) {
    return (
      <div className={cx(aspect, 'overflow-hidden rounded-xl bg-foam')}>
        <CoverImage src={null} alt={alt} priority={priority} />
      </div>
    );
  }

  if (count === 1) {
    return (
      <div className={cx(aspect, 'overflow-hidden rounded-xl')}>
        <CoverImage src={images[0] ?? null} alt={alt} priority={priority} />
      </div>
    );
  }

  if (count === 2) {
    // Equal halves, edge-to-edge — no gutter / foam gap (Saved, Explore, My designs).
    return (
      <div className="grid aspect-square grid-cols-2 grid-rows-1 gap-0 overflow-hidden rounded-xl">
        <div className="relative h-full min-h-0 overflow-hidden">
          <CoverImage src={images[0] ?? null} alt="" priority={priority} />
        </div>
        <div className="relative h-full min-h-0 overflow-hidden">
          <CoverImage src={images[1] ?? null} alt="" priority={priority} />
        </div>
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid aspect-square grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-xl bg-line">
        <div className="relative row-span-2 min-h-0 overflow-hidden bg-foam">
          <CoverImage src={images[0] ?? null} alt="" priority={priority} />
        </div>
        <div className="relative min-h-0 overflow-hidden bg-foam">
          <CoverImage src={images[1] ?? null} alt="" priority={priority} />
        </div>
        <div className="relative min-h-0 overflow-hidden bg-foam">
          <CoverImage src={images[2] ?? null} alt="" priority={priority} />
        </div>
      </div>
    );
  }

  // 4+: equal 2×2; fourth cell shows leftover after four thumbs.
  const overflow = albumOverflowLabel(imageCount);
  const cells = [images[0], images[1], images[2], images[3] ?? images[2]];

  return (
    <div className="grid aspect-square grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-xl bg-line">
      {cells.map((src, index) => {
        const isOverflow = index === 3 && overflow;
        return (
          <div key={index} className="relative min-h-0 overflow-hidden bg-foam">
            {src ? <CoverImage src={src} alt="" priority={priority} /> : null}
            {isOverflow ? (
              <div className="absolute inset-0 flex items-center justify-center bg-ink/55">
                <span className="text-2xl font-bold tracking-tight text-white">{overflow}</span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** You / shop Feed — same inset mosaic + caption as Explore (no shop header). */
export function CatalogFeedPost({
  name,
  meta,
  source,
  detail,
  href,
  images,
  imageCount,
  company,
  companyTo,
  selected = false,
  selectMode = false,
  onMediaClick,
  onLongSelect,
  mediaTestId,
  openTestId,
}: {
  name: string;
  meta?: string;
  /** Owner mill cue — louder than tags. */
  source?: string | null;
  detail?: string;
  href: string;
  images: string[];
  imageCount: number;
  company?: Parameters<typeof ShopPostHeader>[0]['company'];
  companyTo?: string;
  selected?: boolean;
  selectMode?: boolean;
  onMediaClick: () => void;
  onLongSelect?: () => void;
  mediaTestId?: string;
  openTestId?: string;
}) {
  const longPress = useLongPress(onLongSelect);
  const shopTo = companyTo ?? (company ? `/company/${company.id}` : undefined);
  return (
    <article className={EXPLORE_POST_ARTICLE_CLASS}>
      {company && shopTo ? (
        <ShopPostHeader company={company} to={shopTo} />
      ) : null}
      <button
        type="button"
        aria-label={selectMode ? `Select ${name}` : name}
        data-testid={mediaTestId}
        className={cx(
          'relative block w-full text-left',
          EXPLORE_POST_MEDIA_INSET_CLASS,
          LONG_PRESS_SURFACE_CLASS,
        )}
        onClick={onMediaClick}
        {...longPress}
      >
        <SelectableMediaFrame selectMode={selectMode} selected={selected}>
          <AlbumGrid images={images} imageCount={imageCount} alt={name} frame="feed" />
        </SelectableMediaFrame>
      </button>
      <Link
        to={href}
        data-testid={openTestId}
        className={cx('mt-1.5 block w-full text-left', EXPLORE_POST_MEDIA_INSET_CLASS)}
      >
        <p className="text-sm font-semibold tracking-tight text-ink">{name}</p>
        {source ? (
          <p
            className="text-sm font-semibold tracking-tight text-ink"
            data-testid="catalog-feed-source"
          >
            {source}
          </p>
        ) : null}
        {meta ? <p className="text-xs font-medium text-muted">{meta}</p> : null}
        {detail ? <p className="text-xs font-medium text-muted">{detail}</p> : null}
      </Link>
    </article>
  );
}

function PostHeader({
  company,
}: {
  company: PublicCompanySummary;
}) {
  return (
    <ShopPostHeader
      company={company}
      to={`/company/${company.id}`}
      nameClassName="text-sm font-bold tracking-tight text-ink"
    />
  );
}

/** Vertical Explore / market post — company header + WhatsApp album + title. */
export function CollectionPost({ collection }: { collection: CollectionCard }) {
  return (
    <article className={EXPLORE_POST_ARTICLE_CLASS}>
      <PostHeader company={collection.company} />
      <Link to={`/collections/${collection.id}`} className={cx('block', EXPLORE_POST_MEDIA_INSET_CLASS)}>
        <AlbumGrid
          images={collection.previewImages}
          imageCount={collectionMosaicCount({
            productCount: collection.productCount,
            previewCount: collection.previewImages.length,
          })}
          alt={collection.name}
        />
      </Link>
      <Link to={`/collections/${collection.id}`} className={cx('block', EXPLORE_POST_MEDIA_INSET_CLASS)}>
        <ExploreFeedCaption
          title={collection.name}
          meta={[designCountLabel(collection.productCount), postedWhen(collection.updatedAt)]
            .filter(Boolean)
            .join(' · ')}
          rateLine={exploreFeedRateLine({
            rate: collection.rateMin,
            rateMax: collection.rateMax,
            unit: collection.rateUnit,
          })}
          categoryLine={exploreFeedCategoryLine(collection.categories)}
          about={collection.description}
        />
      </Link>
    </article>
  );
}

/** Single-design Explore post. */
export function ProductPost({ product }: { product: ExploreProductCard }) {
  return (
    <article className={EXPLORE_POST_ARTICLE_CLASS}>
      <PostHeader company={product.company} />
      <Link to={`/explore/products/${product.id}`} className={cx('block', EXPLORE_POST_MEDIA_INSET_CLASS)}>
        <AlbumGrid
          images={product.images[0] ? [product.images[0]] : []}
          imageCount={1}
          alt={product.name}
        />
      </Link>
      <Link to={`/explore/products/${product.id}`} className={cx('block', EXPLORE_POST_MEDIA_INSET_CLASS)}>
        <ExploreFeedCaption
          title={product.name}
          meta={[
            product.images.length > 1 ? `Design · ${product.images.length} photos` : 'Design',
            postedWhen(product.postedAt),
          ]
            .filter(Boolean)
            .join(' · ')}
          rateLine={exploreFeedRateLine({
            rate: product.rate,
            rateMax: product.rateMax,
            unit: product.unit,
            dispatchUnit: product.dispatchUnit,
          })}
          categoryLine={exploreFeedCategoryLine(product.categories)}
        />
      </Link>
    </article>
  );
}

export function ExploreFeedPost({ post }: { post: ExplorePost }) {
  if (post.kind === 'product') {
    return <ProductPost product={post.product} />;
  }
  return <CollectionPost collection={post.collection} />;
}

export function ProductTile({
  product,
}: {
  product: DiscoveryProductCard | ProductView;
}) {
  const image = 'images' in product ? product.images[0] ?? null : null;
  return (
    <div className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-soft)]">
      <div className="h-32 w-full overflow-hidden">
        <CoverImage src={image} alt={product.name} />
      </div>
      <div className="p-2.5">
        <p className="truncate text-sm font-bold tracking-tight text-ink">{product.name}</p>
        {'company' in product && product.company?.name ? (
          <p className="truncate text-xs font-medium text-muted">{product.company.name}</p>
        ) : 'companyName' in product && product.companyName?.trim() ? (
          <p className="truncate text-xs font-medium text-muted">{product.companyName.trim()}</p>
        ) : null}
        <p className="text-xs font-medium text-muted">
          {formatCatalogRate({
            rate: product.rate,
            rateMax: product.rateMax,
            unit: product.unit,
            dispatchUnit:
              'dispatchUnit' in product
                ? (product as { dispatchUnit?: string | null }).dispatchUnit
                : undefined,
          })}
        </p>
      </div>
    </div>
  );
}
