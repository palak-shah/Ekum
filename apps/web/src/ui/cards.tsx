import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
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
import { formatRate, timeAgo } from '@/lib/format';
import { Avatar, Chip, Tag, cx } from './kit';
import { CheckIcon, ChevronRightIcon } from './icons';
import { useLongPress } from './useLongPress';

function VerificationTag({ verification }: { verification: string }) {
  if (verification === 'gst_verified') {
    return <Tag tone="success">GST verified</Tag>;
  }
  return null;
}

export function CompanyRow({
  company,
  to,
  relevance,
  plain = false,
}: {
  company: PublicCompanySummary | CompanyCard;
  to?: string;
  /** Sparse trust / relevance line; falls back to city. */
  relevance?: string | null;
  /** Flat list row (Explore sections) instead of a padded card. */
  plain?: boolean;
}) {
  const subtitle = relevance?.trim() || company.city;
  const inner = (
    <div className="flex items-center gap-3">
      <Avatar name={company.name} imageUrl={company.logoUrl} size={plain ? 40 : undefined} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold tracking-tight text-ink">{company.name}</p>
        <p className="truncate text-xs font-medium text-muted">{subtitle}</p>
      </div>
      {!relevance && <VerificationTag verification={company.verification} />}
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
}: {
  opportunity: ExploreOpportunity;
  selected?: boolean;
  selectMode?: boolean;
  onLongSelect?: () => void;
  onToggleSelect?: () => void;
  onOpen?: () => void;
  /** Follow control or other header trailing chrome (replaces posted time when set). */
  headerTrailing?: ReactNode;
}) {
  const { collection, relevance } = opportunity;
  const company = collection.company;
  const when = postedWhen(collection.updatedAt);
  const longPress = useLongPress(onLongSelect);
  const open = selectMode && onToggleSelect ? onToggleSelect : undefined;
  return (
    <article className="-mx-4 border-b border-line/70 pb-3.5">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Link to={`/company/${company.id}`} className="shrink-0">
          <Avatar name={company.name} imageUrl={company.logoUrl} size={40} />
        </Link>
        <Link to={`/company/${company.id}`} className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold tracking-tight text-ink">{company.name}</p>
          <p className="truncate text-xs font-medium text-muted">
            {relevance?.trim() || company.city}
          </p>
        </Link>
        {headerTrailing ??
          (when ? (
            <span className="shrink-0 text-xs font-medium text-muted">{when}</span>
          ) : null)}
      </div>
      {open ? (
        <button type="button" className="relative block w-full px-3 text-left" onClick={open} {...longPress}>
          <AlbumGrid
            images={collection.previewImages}
            imageCount={collection.imageCount}
            alt={collection.name}
          />
          <span
            className={cx(
              'absolute left-5 top-2 flex h-6 w-6 items-center justify-center rounded-full border text-white',
              selected ? 'border-accent bg-accent' : 'border-line bg-white/90 text-transparent',
            )}
          >
            <CheckIcon width={14} height={14} />
          </span>
        </button>
      ) : (
        <Link
          to={`/collections/${collection.id}`}
          className="block px-3"
          onClick={() => onOpen?.()}
          {...longPress}
        >
          <AlbumGrid
            images={collection.previewImages}
            imageCount={collection.imageCount}
            alt={collection.name}
          />
        </Link>
      )}
      {open ? (
        <button type="button" className="mt-2 block w-full px-4 text-left" onClick={open}>
          <p className="text-sm font-semibold tracking-tight text-ink">{collection.name}</p>
          <p className="text-xs font-medium text-muted">{collection.productCount} designs</p>
        </button>
      ) : (
        <Link
          to={`/collections/${collection.id}`}
          className="mt-2 block px-4"
          onClick={() => onOpen?.()}
        >
          <p className="text-sm font-semibold tracking-tight text-ink">{collection.name}</p>
          <p className="text-xs font-medium text-muted">{collection.productCount} designs</p>
        </Link>
      )}
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
      relevance={opportunity.relevance}
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
  relevance,
  previewImages = [],
  designCount = 0,
  collectionCount = 0,
  latestPostedAt = null,
  intentSide = 'sell',
}: {
  company: BusinessCardModel['company'];
  relevance: string | null;
  previewImages?: string[];
  designCount?: number;
  collectionCount?: number;
  latestPostedAt?: string | null;
  intentSide?: 'buy' | 'sell';
}) {
  const why = relevance?.trim() || company.city;
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
    <article className="-mx-4 border-b border-line/70 pb-3.5">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Link to={shopTo} className="shrink-0">
          <Avatar name={company.name} imageUrl={company.logoUrl} size={40} />
        </Link>
        <Link to={shopTo} className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold tracking-tight text-ink">{company.name}</p>
          <p className="truncate text-xs font-medium text-muted">{why}</p>
        </Link>
        {when ? (
          <span className="shrink-0 text-xs font-medium text-muted">{when}</span>
        ) : (
          <VerificationTag verification={company.verification} />
        )}
      </div>
      <Link to={shopTo} className="block px-3">
        {hasShopVisual ? (
          <>
            <AlbumGrid images={previews} imageCount={imageCount} alt={company.name} />
            <div className="mt-2 flex items-start justify-between gap-3 px-1">
              <div className="min-w-0">
                {catalogLine ? (
                  <p className="text-sm font-semibold tracking-tight text-ink">{catalogLine}</p>
                ) : null}
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
  relevance,
  previewImages = [],
}: {
  company: BusinessCardModel['company'];
  relevance: string | null;
  previewImages?: string[];
}) {
  const cover = previewImages[0] ?? null;
  const why = relevance?.trim() || company.city;
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
        <p className="truncate text-sm font-semibold text-ink">{company.name}</p>
        <p className="truncate text-xs text-muted">{why}</p>
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
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-soft)]">
      <Avatar name={company.name} imageUrl={company.logoUrl} size={56} />
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
}: {
  opportunity: ExploreDesignOpportunity;
  selected?: boolean;
  selectMode?: boolean;
  onLongSelect?: () => void;
  onToggleSelect?: () => void;
  onOpen?: () => void;
  headerTrailing?: ReactNode;
}) {
  const { product, relevance } = opportunity;
  const company = product.company;
  const when = postedWhen(product.postedAt);
  const longPress = useLongPress(onLongSelect);
  const open = selectMode && onToggleSelect ? onToggleSelect : undefined;

  return (
    <article className="-mx-4 border-b border-line/70 pb-3.5">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Link to={`/company/${company.id}`} className="shrink-0">
          <Avatar name={company.name} imageUrl={company.logoUrl} size={40} />
        </Link>
        <Link to={`/company/${company.id}`} className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold tracking-tight text-ink">{company.name}</p>
          <p className="truncate text-xs font-medium text-muted">
            {relevance?.trim() || company.city}
          </p>
        </Link>
        {headerTrailing ??
          (when ? (
            <span className="shrink-0 text-xs font-medium text-muted">{when}</span>
          ) : null)}
      </div>
      {open ? (
        <button type="button" className="relative block w-full px-3 text-left" onClick={open} {...longPress}>
          <AlbumGrid images={product.images} imageCount={product.images.length} alt={product.name} />
          <span
            className={cx(
              'absolute left-5 top-2 flex h-6 w-6 items-center justify-center rounded-full border text-white',
              selected ? 'border-accent bg-accent' : 'border-line bg-white/90 text-transparent',
            )}
          >
            <CheckIcon width={14} height={14} />
          </span>
        </button>
      ) : (
        <Link
          to={`/explore/products/${product.id}`}
          className="block px-3"
          onClick={() => onOpen?.()}
          {...longPress}
        >
          <AlbumGrid images={product.images} imageCount={product.images.length} alt={product.name} />
        </Link>
      )}
      {open ? (
        <button type="button" className="mt-2 block w-full px-4 text-left" onClick={open}>
          <p className="text-sm font-semibold tracking-tight text-ink">{product.name}</p>
          <p className="text-xs font-medium text-muted">Design</p>
        </button>
      ) : (
        <Link
          to={`/explore/products/${product.id}`}
          className="mt-2 block px-4"
          onClick={() => onOpen?.()}
        >
          <p className="text-sm font-semibold tracking-tight text-ink">{product.name}</p>
          <p className="text-xs font-medium text-muted">Design</p>
        </Link>
      )}
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
  const selecting = selectMode && onToggleSelect;

  const body = (
    <>
      <div className="relative p-1.5">
        <AlbumGrid
          images={product.images}
          imageCount={product.images.length}
          alt={product.name}
        />
        {selectMode ? (
          <span
            className={cx(
              'absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border text-white',
              selected ? 'border-accent bg-accent' : 'border-line bg-white/90 text-transparent',
            )}
          >
            <CheckIcon width={14} height={14} />
          </span>
        ) : null}
      </div>
      <div className="px-2.5 pb-2.5">
        <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
        <p className="truncate text-xs text-muted">Design</p>
      </div>
    </>
  );

  if (selecting) {
    return (
      <button
        type="button"
        className={cx(
          'block w-full overflow-hidden rounded-2xl border bg-surface text-left',
          selected ? 'border-accent' : 'border-line',
        )}
        onClick={onToggleSelect}
        {...longPress}
      >
        {body}
      </button>
    );
  }

  return (
    <Link
      to={`/explore/products/${product.id}`}
      className="block overflow-hidden rounded-2xl border border-line bg-surface"
      {...longPress}
    >
      {body}
    </Link>
  );
}

/** Fills its parent; parent must set size + overflow-hidden. */
function CoverImage({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cx('h-full w-full object-cover', className)}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={cx(
        'flex h-full w-full items-center justify-center bg-foam text-2xl font-bold text-muted',
        className,
      )}
    >
      {alt.charAt(0).toUpperCase()}
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
  const images =
    collection.previewImages.length > 0
      ? collection.previewImages
      : collection.coverImage
        ? [collection.coverImage]
        : [];
  return (
    <Link
      to={`/collections/${collection.id}`}
      className="block overflow-hidden rounded-2xl border border-line bg-surface"
    >
      <div className="p-1.5">
        <AlbumGrid
          images={images}
          imageCount={Math.max(collection.imageCount ?? images.length, images.length)}
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
  const cover = collection.previewImages[0] ?? collection.coverImage;
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
        <p className="text-xs text-muted">{collection.productCount} designs</p>
      </div>
      <ChevronRightIcon className="shrink-0 text-muted" />
    </Link>
  );
}

/**
 * WhatsApp-style album mosaic: thin gutters, no blank cells.
 * 1 → square; 2 → side-by-side; 3 → tall left + two stacked right;
 * 4+ → 2×2 with dark +N on the fourth cell when more than 4.
 */
export function AlbumGrid({
  images,
  imageCount,
  alt,
}: {
  images: string[];
  imageCount: number;
  alt: string;
}) {
  const count = Math.max(images.length, imageCount);
  if (count <= 0) {
    return (
      <div className="aspect-square overflow-hidden rounded-xl bg-foam">
        <CoverImage src={null} alt={alt} />
      </div>
    );
  }

  if (count === 1) {
    return (
      <div className="aspect-square overflow-hidden rounded-xl">
        <CoverImage src={images[0] ?? null} alt={alt} />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl bg-line">
        {images.slice(0, 2).map((src, index) => (
          <div key={index} className="aspect-square overflow-hidden bg-foam">
            <CoverImage src={src} alt="" />
          </div>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid aspect-square grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-xl bg-line">
        <div className="relative row-span-2 overflow-hidden bg-foam">
          <CoverImage src={images[0] ?? null} alt="" />
        </div>
        <div className="relative overflow-hidden bg-foam">
          <CoverImage src={images[1] ?? null} alt="" />
        </div>
        <div className="relative overflow-hidden bg-foam">
          <CoverImage src={images[2] ?? null} alt="" />
        </div>
      </div>
    );
  }

  // 4+: equal 2×2; fourth cell shows +N when there are more than 4 images.
  const showPlus = imageCount > 4;
  const cells = [images[0], images[1], images[2], images[3] ?? images[2]];

  return (
    <div className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl bg-line">
      {cells.map((src, index) => {
        const isOverflow = index === 3 && showPlus;
        return (
          <div key={index} className="relative aspect-square overflow-hidden bg-foam">
            {src ? <CoverImage src={src} alt="" /> : null}
            {isOverflow ? (
              <div className="absolute inset-0 flex items-center justify-center bg-ink/55">
                <span className="text-2xl font-bold tracking-tight text-white">
                  +{imageCount - 3}
                </span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function PostHeader({
  company,
  postedAt,
}: {
  company: PublicCompanySummary;
  postedAt: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Link to={`/company/${company.id}`} className="shrink-0">
        <Avatar name={company.name} imageUrl={company.logoUrl} size={40} />
      </Link>
      <Link to={`/company/${company.id}`} className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold tracking-tight text-ink">{company.name}</p>
        <p className="truncate text-xs font-medium text-muted">
          {company.city}
          {postedAt ? ` · ${timeAgo(postedAt)}` : null}
        </p>
      </Link>
    </div>
  );
}

/** Vertical Explore / market post — company header + WhatsApp album + title. */
export function CollectionPost({ collection }: { collection: CollectionCard }) {
  return (
    <article className="-mx-4 border-b border-line/80 pb-4">
      <PostHeader company={collection.company} postedAt={collection.updatedAt} />
      <Link to={`/collections/${collection.id}`} className="block px-3">
        <AlbumGrid
          images={collection.previewImages}
          imageCount={collection.imageCount}
          alt={collection.name}
        />
      </Link>
      <Link to={`/collections/${collection.id}`} className="mt-2.5 block px-4">
        <p className="text-sm font-bold tracking-tight text-ink">{collection.name}</p>
        <p className="text-xs font-medium text-muted">{collection.productCount} designs</p>
      </Link>
    </article>
  );
}

/** Single-design Explore post. */
export function ProductPost({ product }: { product: ExploreProductCard }) {
  return (
    <article className="-mx-4 border-b border-line/80 pb-4">
      <PostHeader company={product.company} postedAt={product.postedAt} />
      <Link to={`/explore/products/${product.id}`} className="block px-3">
        <AlbumGrid images={product.images} imageCount={product.images.length} alt={product.name} />
      </Link>
      <Link to={`/explore/products/${product.id}`} className="mt-2.5 block px-4">
        <p className="text-sm font-bold tracking-tight text-ink">{product.name}</p>
        <p className="text-xs font-medium text-muted">Design</p>
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
        <p className="text-xs font-medium text-muted">{formatRate(product.rate, product.unit)}</p>
      </div>
    </div>
  );
}
