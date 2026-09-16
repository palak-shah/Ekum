import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { PhotoViewer } from '@/ui/PhotoViewer';
import { cx } from '@/ui/kit';

export type DesignAlbumItem = {
  id: string;
  name: string;
  image: string | null;
};

/**
 * Compact design grid for chat (thumb + name — not trade-card chrome).
 * Tap → swipe viewer with design caption + View design → (same open as product_card).
 */
export function DesignAlbumGrid({
  items,
  locked = false,
  interactive = true,
  /** Path for View design → (same as product_card). */
  designPath,
  /** Guest / no-router fallback. */
  onOpenDesign,
  className,
}: {
  items: DesignAlbumItem[];
  locked?: boolean;
  interactive?: boolean;
  designPath?: (productId: string) => string;
  onOpenDesign?: (productId: string) => void;
  className?: string;
}) {
  const navigate = useNavigate();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  /** Prefer items with images in the swipe set; nameless still listed in grid. */
  const viewable = items.filter((item) => Boolean(item.image));
  const urls = viewable.map((item) => toAbsoluteMediaUrl(item.image!));
  const captions = viewable.map((item) => item.name);

  const openViewerAt = (item: DesignAlbumItem) => {
    if (!interactive || locked) return;
    const idx = viewable.findIndex((row) => row.id === item.id);
    if (idx >= 0) {
      setViewerIndex(idx);
      return;
    }
    goToDesign(item.id);
  };

  const goToDesign = (productId: string) => {
    const path = designPath?.(productId);
    if (path) {
      navigate(path);
      return;
    }
    onOpenDesign?.(productId);
  };

  if (items.length === 0) return null;

  const cols = items.length === 1 ? 1 : 2;
  const canTap = interactive && !locked;

  return (
    <div className={cx('w-full', className)} data-testid="design-album-grid">
      <div
        className={cx('grid gap-1.5 p-2', cols === 1 ? 'grid-cols-1' : 'grid-cols-2')}
      >
        {items.map((item) => {
          const src = item.image ? toAbsoluteMediaUrl(item.image) : '';
          return (
            <button
              key={item.id}
              type="button"
              disabled={!canTap}
              onClick={() => openViewerAt(item)}
              className={cx(
                'overflow-hidden rounded-xl border border-line bg-foam text-left',
                canTap ? 'active:opacity-90' : 'cursor-default',
              )}
              data-testid="design-album-tile"
            >
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
              </div>
            </button>
          );
        })}
      </div>
      {viewerIndex !== null && urls.length > 0 && !locked ? (
        <PhotoViewer
          open
          urls={urls}
          captions={captions}
          index={viewerIndex}
          onIndex={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          headerAction={{
            label: 'View design →',
            testId: 'design-album-view-design',
            onClick: () => {
              const item = viewable[viewerIndex];
              if (!item) return;
              setViewerIndex(null);
              goToDesign(item.id);
            },
          }}
        />
      ) : null}
    </div>
  );
}
