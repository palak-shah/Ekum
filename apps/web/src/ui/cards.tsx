import { Link } from 'react-router-dom';
import type {
  CollectionCard,
  DiscoveryProductCard,
  ProductView,
  PublicCompanySummary,
} from '@ekum/domain-types';
import { formatRate, timeAgo } from '@/lib/format';
import { Avatar, Tag, cx } from './kit';
import { ChevronRightIcon } from './icons';

function VerificationTag({ verification }: { verification: string }) {
  if (verification === 'gst_verified') {
    return <Tag tone="success">GST verified</Tag>;
  }
  return null;
}

export function CompanyRow({ company, to }: { company: PublicCompanySummary; to?: string }) {
  const inner = (
    <div className="flex items-center gap-3">
      <Avatar name={company.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{company.name}</p>
        <p className="truncate text-xs text-muted">{company.city}</p>
      </div>
      <VerificationTag verification={company.verification} />
      {to ? <ChevronRightIcon className="text-muted" /> : null}
    </div>
  );
  if (to) {
    return (
      <Link to={to} className="block rounded-2xl border border-line bg-surface p-3.5 hover:bg-foam">
        {inner}
      </Link>
    );
  }
  return <div className="rounded-2xl border border-line bg-surface p-3.5">{inner}</div>;
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
  const cover = collection.previewImages[0] ?? collection.coverImage;
  return (
    <Link
      to={`/collections/${collection.id}`}
      className="block w-44 shrink-0 overflow-hidden rounded-2xl border border-line bg-surface p-2.5 hover:bg-foam"
    >
      <div className="h-32 w-full overflow-hidden rounded-xl">
        <CoverImage src={cover} alt={collection.name} />
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-ink">{collection.name}</p>
      {showCompany ? (
        <p className="truncate text-xs text-muted">{collection.company.name}</p>
      ) : null}
      <p className="mt-0.5 text-xs text-muted">{collection.productCount} designs</p>
    </Link>
  );
}

export function CollectionListItem({ collection }: { collection: CollectionCard }) {
  const cover = collection.previewImages[0] ?? collection.coverImage;
  return (
    <Link
      to={`/collections/${collection.id}`}
      className="flex items-center gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-2.5 hover:bg-foam"
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
 * WhatsApp-style album preview: equal cells, thin gutters.
 * 4+ images → 2×2 with dark +N on the fourth cell (3 clear + overflow).
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

  // 3 or 4+: equal 2×2. For exactly 3, bottom-right stays empty (no +N).
  // For 4+, fourth cell shows image under +(imageCount - 3).
  const showPlus = imageCount > 4;
  const cells: Array<string | null> = [
    images[0] ?? null,
    images[1] ?? null,
    images[2] ?? null,
    showPlus || images[3] ? images[3] ?? images[2] ?? null : null,
  ];

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

/** Vertical Explore / market post — company header + WhatsApp album + title. */
export function CollectionPost({ collection }: { collection: CollectionCard }) {
  return (
    <article className="-mx-4 border-b border-line pb-3">
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to={`/company/${collection.company.id}`} className="shrink-0">
          <Avatar name={collection.company.name} size={40} />
        </Link>
        <Link to={`/company/${collection.company.id}`} className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{collection.company.name}</p>
          <p className="truncate text-xs text-muted">
            {collection.company.city}
            {collection.updatedAt ? ` · ${timeAgo(collection.updatedAt)}` : null}
          </p>
        </Link>
      </div>
      <Link to={`/collections/${collection.id}`} className="block px-3">
        <AlbumGrid
          images={collection.previewImages}
          imageCount={collection.imageCount}
          alt={collection.name}
        />
      </Link>
      <Link to={`/collections/${collection.id}`} className="mt-2 block px-4">
        <p className="text-sm font-semibold text-ink">{collection.name}</p>
        <p className="text-xs text-muted">{collection.productCount} designs</p>
      </Link>
    </article>
  );
}

export function ProductTile({
  product,
}: {
  product: DiscoveryProductCard | ProductView;
}) {
  const image = 'images' in product ? product.images[0] ?? null : null;
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="h-32 w-full overflow-hidden">
        <CoverImage src={image} alt={product.name} />
      </div>
      <div className="p-2.5">
        <p className="truncate text-sm font-medium text-ink">{product.name}</p>
        <p className="text-xs text-muted">{formatRate(product.rate, product.unit)}</p>
      </div>
    </div>
  );
}
