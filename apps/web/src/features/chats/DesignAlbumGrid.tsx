import { Link } from 'react-router-dom';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { cx } from '@/ui/kit';

export type DesignAlbumItem = {
  id: string;
  name: string;
  image: string | null;
};

/**
 * Chat-friendly grid of designs (thumb + name + View design).
 * Tap / View design → same destination as a single design card — not PhotoViewer.
 */
export function DesignAlbumGrid({
  items,
  locked = false,
  interactive = true,
  /** Path builder — same as product_card `View design →`. */
  designPath,
  onOpenDesign,
  className,
}: {
  items: DesignAlbumItem[];
  locked?: boolean;
  interactive?: boolean;
  /** When set, tiles link like product_card (`to` + View design →). */
  designPath?: (productId: string) => string;
  /** Fallback click when no path (e.g. guest share → join). */
  onOpenDesign?: (productId: string) => void;
  className?: string;
}) {
  if (items.length === 0) return null;

  const cols = items.length === 1 ? 1 : 2;
  const canOpen = interactive && !locked;

  return (
    <div className={cx('w-full', className)} data-testid="design-album-grid">
      <div
        className={cx('grid gap-1.5 p-2', cols === 1 ? 'grid-cols-1' : 'grid-cols-2')}
      >
        {items.map((item) => {
          const src = item.image ? toAbsoluteMediaUrl(item.image) : '';
          const path = designPath?.(item.id);
          const body = (
            <>
              {src ? (
                <img
                  src={src}
                  alt=""
                  className={cx(
                    'aspect-[3/4] w-full object-cover',
                    locked ? 'blur-[3px] scale-110' : null,
                  )}
                />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center bg-canvas text-lg font-bold text-muted">
                  {(item.name.trim().charAt(0) || '?').toUpperCase()}
                </div>
              )}
              <div className="px-2 py-1.5">
                <p className="truncate text-[11px] font-semibold leading-snug text-ink">
                  {item.name}
                </p>
                <p className="text-[10px] font-medium text-muted">Design</p>
                {canOpen ? (
                  <p
                    className="mt-0.5 text-[11px] font-semibold text-accent"
                    data-testid="design-album-view"
                  >
                    View design →
                  </p>
                ) : null}
              </div>
            </>
          );

          if (canOpen && path) {
            return (
              <Link
                key={item.id}
                to={path}
                className="overflow-hidden rounded-xl border border-line bg-foam text-left active:opacity-90"
                data-testid="design-album-tile"
              >
                {body}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              disabled={!canOpen}
              onClick={() => {
                if (!canOpen) return;
                onOpenDesign?.(item.id);
              }}
              className={cx(
                'overflow-hidden rounded-xl border border-line bg-foam text-left',
                canOpen ? 'active:opacity-90' : 'cursor-default',
              )}
              data-testid="design-album-tile"
            >
              {body}
            </button>
          );
        })}
      </div>
    </div>
  );
}
