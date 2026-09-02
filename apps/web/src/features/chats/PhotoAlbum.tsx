import { useState, type ReactNode } from 'react';
import { PhotoViewer } from '@/ui/PhotoViewer';
import { cx } from '@/ui/kit';

const GUTTER = 2;

function urlAt(urls: string[], index: number): string {
  return urls[index] ?? '';
}

function Cell({
  src,
  className,
  onClick,
  overlay,
  rounded,
  overlayClass,
}: {
  src: string;
  className?: string;
  onClick: () => void;
  overlay?: string;
  rounded?: string;
  overlayClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx('relative block h-full w-full overflow-hidden bg-foam', rounded, className)}
    >
      <img src={src} alt="" className="h-full w-full object-cover" />
      {overlay ? (
        <span
          data-testid="photo-album-overflow"
          className={cx(
            'absolute inset-0 flex items-center justify-center bg-ink/55 font-semibold text-white',
            overlayClass ?? 'text-2xl',
          )}
        >
          {overlay}
        </span>
      ) : null}
    </button>
  );
}

/** Full = photo messages; compact = legacy share cards; thumb = inline chat trade cards. */
export function PhotoAlbum({
  urls,
  /** Extra items beyond `urls` (e.g. more designs in a collection than preview thumbs). */
  overflowCount = 0,
  size = 'full',
}: {
  urls: string[];
  overflowCount?: number;
  size?: 'full' | 'compact' | 'thumb';
}) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  // Drop blanks so a bad reference never throws through the router error boundary.
  const clean = urls.filter((url): url is string => Boolean(url));
  const thumb = size === 'thumb';
  const preview = clean.slice(0, thumb ? 2 : 4);
  const compact = size === 'compact';
  const overlayClass = thumb ? 'text-[10px]' : compact ? 'text-sm' : 'text-2xl';

  if (clean.length === 0) return null;

  const open = (index: number) => setViewerIndex(index);
  /** Thumbs beyond the preview, plus designs with no image still counted on the card. */
  const extra = Math.max(0, clean.length - preview.length) + Math.max(0, overflowCount);
  const moreLabel = extra > 0 ? `+${extra}` : undefined;
  const count = preview.length;

  if (thumb) {
    // Fixed ~40px cells — single design thumbs must not expand to bubble width.
    const grid =
      count === 1 ? (
        <div className="h-10 w-10">
          <Cell
            src={urlAt(preview, 0)}
            onClick={() => open(0)}
            rounded="rounded-md"
            overlay={moreLabel}
            overlayClass={overlayClass}
          />
        </div>
      ) : (
        <div className="grid h-10 w-[5.25rem] grid-cols-2" style={{ gap: GUTTER }}>
          <Cell
            src={urlAt(preview, 0)}
            onClick={() => open(0)}
            rounded="rounded-l-md"
            overlayClass={overlayClass}
          />
          <Cell
            src={urlAt(preview, 1)}
            onClick={() => open(1)}
            rounded="rounded-r-md"
            overlay={moreLabel}
            overlayClass={overlayClass}
          />
        </div>
      );
    return (
      <>
        <div className="h-10 w-fit shrink-0 overflow-hidden" data-testid="photo-album-thumb">
          {grid}
        </div>
        <PhotoViewer
          open={viewerIndex !== null}
          urls={clean}
          index={viewerIndex ?? 0}
          onIndex={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      </>
    );
  }

  let grid: ReactNode;
  if (count === 1) {
    grid = (
      <button
        type="button"
        onClick={() => open(0)}
        className="relative block w-full overflow-hidden rounded-2xl bg-foam"
      >
        <img
          src={urlAt(preview, 0)}
          alt=""
          className={cx('w-full object-cover', compact ? 'max-h-28' : 'max-h-72')}
        />
        {moreLabel ? (
          <span
            data-testid="photo-album-overflow"
            className={cx(
              'absolute inset-0 flex items-center justify-center bg-ink/55 font-semibold text-white',
              overlayClass,
            )}
          >
            {moreLabel}
          </span>
        ) : null}
      </button>
    );
  } else if (count === 2) {
    grid = (
      <div className={cx('grid grid-cols-2', compact ? 'h-16' : 'h-40')} style={{ gap: GUTTER }}>
        <Cell
          src={urlAt(preview, 0)}
          onClick={() => open(0)}
          rounded="rounded-l-2xl"
          overlayClass={overlayClass}
        />
        <Cell
          src={urlAt(preview, 1)}
          onClick={() => open(1)}
          rounded="rounded-r-2xl"
          overlay={moreLabel}
          overlayClass={overlayClass}
        />
      </div>
    );
  } else if (count === 3) {
    grid = (
      <div className={cx('grid grid-cols-2', compact ? 'h-20' : 'h-52')} style={{ gap: GUTTER }}>
        <Cell
          src={urlAt(preview, 0)}
          onClick={() => open(0)}
          rounded="rounded-l-2xl"
          className="row-span-2"
          overlayClass={overlayClass}
        />
        <div className="grid h-full grid-rows-2" style={{ gap: GUTTER }}>
          <Cell
            src={urlAt(preview, 1)}
            onClick={() => open(1)}
            rounded="rounded-tr-2xl"
            overlayClass={overlayClass}
          />
          <Cell
            src={urlAt(preview, 2)}
            onClick={() => open(2)}
            rounded="rounded-br-2xl"
            overlay={moreLabel}
            overlayClass={overlayClass}
          />
        </div>
      </div>
    );
  } else {
    grid = (
      <div
        className={cx('grid grid-cols-2 grid-rows-2', compact ? 'h-20' : 'h-52')}
        style={{ gap: GUTTER }}
      >
        <Cell
          src={urlAt(preview, 0)}
          onClick={() => open(0)}
          rounded="rounded-tl-2xl"
          overlayClass={overlayClass}
        />
        <Cell
          src={urlAt(preview, 1)}
          onClick={() => open(1)}
          rounded="rounded-tr-2xl"
          overlayClass={overlayClass}
        />
        <Cell
          src={urlAt(preview, 2)}
          onClick={() => open(2)}
          rounded="rounded-bl-2xl"
          overlayClass={overlayClass}
        />
        <Cell
          src={urlAt(preview, 3)}
          onClick={() => open(3)}
          rounded="rounded-br-2xl"
          overlay={moreLabel}
          overlayClass={overlayClass}
        />
      </div>
    );
  }

  return (
    <>
      <div className={cx('overflow-hidden', compact ? 'w-[120px]' : 'w-full max-w-[280px]')}>
        {grid}
      </div>
      <PhotoViewer
        open={viewerIndex !== null}
        urls={clean}
        index={viewerIndex ?? 0}
        onIndex={setViewerIndex}
        onClose={() => setViewerIndex(null)}
      />
    </>
  );
}
