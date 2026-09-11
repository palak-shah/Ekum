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
  locked,
  well = 'bg-foam',
}: {
  src: string;
  className?: string;
  onClick: () => void;
  overlay?: string;
  rounded?: string;
  overlayClass?: string;
  locked?: boolean;
  /** Trade-card thumbs use canvas — foam washed incoming cards pale green. */
  well?: string;
}) {
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      disabled={locked}
      aria-disabled={locked || undefined}
      className={cx(
        'relative block h-full w-full overflow-hidden',
        well,
        locked ? 'cursor-default' : null,
        rounded,
        className,
      )}
    >
      <img
        src={src}
        alt=""
        className={cx('h-full w-full object-cover', locked ? 'blur-[3px] scale-110' : null)}
      />
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
  /** Gated catalog: small blurred teaser; never open PhotoViewer. */
  locked = false,
}: {
  urls: string[];
  overflowCount?: number;
  size?: 'full' | 'compact' | 'thumb';
  locked?: boolean;
}) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  // Drop blanks so a bad reference never throws through the router error boundary.
  const clean = urls.filter((url): url is string => Boolean(url));
  const thumb = size === 'thumb';
  const preview = clean.slice(0, thumb ? 2 : 4);
  const compact = size === 'compact';
  const overlayClass = thumb ? 'text-[10px]' : compact ? 'text-sm' : 'text-2xl';

  if (clean.length === 0) return null;

  const open = (index: number) => {
    if (locked) return;
    setViewerIndex(index);
  };
  /** Thumbs beyond the preview, plus designs with no image still counted on the card. */
  const extra = Math.max(0, clean.length - preview.length) + Math.max(0, overflowCount);
  const moreLabel = extra > 0 ? `+${extra}` : undefined;
  const count = preview.length;

  const viewer =
    locked || viewerIndex === null ? null : (
      <PhotoViewer
        open
        urls={clean}
        index={viewerIndex}
        onIndex={setViewerIndex}
        onClose={() => setViewerIndex(null)}
      />
    );

  if (thumb) {
    // Compact but photograph-first — fixed cells so single thumbs don’t expand.
    const grid =
      count === 1 ? (
        <div className="h-14 w-14">
          <Cell
            src={urlAt(preview, 0)}
            onClick={() => open(0)}
            rounded="rounded-lg"
            overlay={moreLabel}
            overlayClass={overlayClass}
            locked={locked}
            well="bg-canvas"
          />
        </div>
      ) : (
        <div className="grid h-14 w-[7.5rem] grid-cols-2" style={{ gap: GUTTER }}>
          <Cell
            src={urlAt(preview, 0)}
            onClick={() => open(0)}
            rounded="rounded-l-lg"
            overlayClass={overlayClass}
            locked={locked}
            well="bg-canvas"
          />
          <Cell
            src={urlAt(preview, 1)}
            onClick={() => open(1)}
            rounded="rounded-r-lg"
            overlay={moreLabel}
            overlayClass={overlayClass}
            locked={locked}
            well="bg-canvas"
          />
        </div>
      );
    return (
      <>
        <div
          className="h-14 w-fit shrink-0 overflow-hidden"
          data-testid="photo-album-thumb"
          data-locked={locked ? 'true' : undefined}
        >
          {grid}
        </div>
        {viewer}
      </>
    );
  }

  let grid: ReactNode;
  if (count === 1) {
    grid = (
      <button
        type="button"
        onClick={() => open(0)}
        disabled={locked}
        className={cx(
          'relative block w-full overflow-hidden rounded-2xl bg-foam',
          locked ? 'cursor-default' : null,
        )}
      >
        <img
          src={urlAt(preview, 0)}
          alt=""
          className={cx(
            'w-full object-cover',
            compact ? 'max-h-28' : 'max-h-72',
            locked ? 'blur-[3px] scale-105' : null,
          )}
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
          locked={locked}
        />
        <Cell
          src={urlAt(preview, 1)}
          onClick={() => open(1)}
          rounded="rounded-r-2xl"
          overlay={moreLabel}
          overlayClass={overlayClass}
          locked={locked}
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
          locked={locked}
        />
        <div className="grid h-full grid-rows-2" style={{ gap: GUTTER }}>
          <Cell
            src={urlAt(preview, 1)}
            onClick={() => open(1)}
            rounded="rounded-tr-2xl"
            overlayClass={overlayClass}
            locked={locked}
          />
          <Cell
            src={urlAt(preview, 2)}
            onClick={() => open(2)}
            rounded="rounded-br-2xl"
            overlay={moreLabel}
            overlayClass={overlayClass}
            locked={locked}
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
          locked={locked}
        />
        <Cell
          src={urlAt(preview, 1)}
          onClick={() => open(1)}
          rounded="rounded-tr-2xl"
          overlayClass={overlayClass}
          locked={locked}
        />
        <Cell
          src={urlAt(preview, 2)}
          onClick={() => open(2)}
          rounded="rounded-bl-2xl"
          overlayClass={overlayClass}
          locked={locked}
        />
        <Cell
          src={urlAt(preview, 3)}
          onClick={() => open(3)}
          rounded="rounded-br-2xl"
          overlay={moreLabel}
          overlayClass={overlayClass}
          locked={locked}
        />
      </div>
    );
  }

  return (
    <>
      <div
        className={cx('overflow-hidden', compact ? 'w-[120px]' : 'w-full max-w-[280px]')}
        data-locked={locked ? 'true' : undefined}
      >
        {grid}
      </div>
      {viewer}
    </>
  );
}
