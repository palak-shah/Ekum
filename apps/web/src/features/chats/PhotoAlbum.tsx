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
}: {
  src: string;
  className?: string;
  onClick: () => void;
  overlay?: string;
  rounded?: string;
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
          className="absolute inset-0 flex items-center justify-center bg-ink/55 text-2xl font-semibold text-white"
        >
          {overlay}
        </span>
      ) : null}
    </button>
  );
}

export function PhotoAlbum({
  urls,
  /** Extra items beyond `urls` (e.g. more designs in a collection than preview thumbs). */
  overflowCount = 0,
}: {
  urls: string[];
  overflowCount?: number;
}) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  // Drop blanks so a bad reference never throws through the router error boundary.
  const clean = urls.filter((url): url is string => Boolean(url));
  const preview = clean.slice(0, 4);

  if (clean.length === 0) return null;

  const open = (index: number) => setViewerIndex(index);
  /** Thumbs beyond the 4-slot preview, plus designs with no image still counted on the card. */
  const extra = Math.max(0, clean.length - preview.length) + Math.max(0, overflowCount);
  const moreLabel = extra > 0 ? `+${extra}` : undefined;
  const count = preview.length;

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
          className="max-h-72 w-full object-cover"
        />
        {moreLabel ? (
          <span
            data-testid="photo-album-overflow"
            className="absolute inset-0 flex items-center justify-center bg-ink/55 text-2xl font-semibold text-white"
          >
            {moreLabel}
          </span>
        ) : null}
      </button>
    );
  } else if (count === 2) {
    grid = (
      <div className="grid h-40 grid-cols-2" style={{ gap: GUTTER }}>
        <Cell src={urlAt(preview, 0)} onClick={() => open(0)} rounded="rounded-l-2xl" />
        <Cell
          src={urlAt(preview, 1)}
          onClick={() => open(1)}
          rounded="rounded-r-2xl"
          overlay={moreLabel}
        />
      </div>
    );
  } else if (count === 3) {
    grid = (
      <div className="grid h-52 grid-cols-2" style={{ gap: GUTTER }}>
        <Cell
          src={urlAt(preview, 0)}
          onClick={() => open(0)}
          rounded="rounded-l-2xl"
          className="row-span-2"
        />
        <div className="grid h-full grid-rows-2" style={{ gap: GUTTER }}>
          <Cell src={urlAt(preview, 1)} onClick={() => open(1)} rounded="rounded-tr-2xl" />
          <Cell
            src={urlAt(preview, 2)}
            onClick={() => open(2)}
            rounded="rounded-br-2xl"
            overlay={moreLabel}
          />
        </div>
      </div>
    );
  } else {
    grid = (
      <div className="grid h-52 grid-cols-2 grid-rows-2" style={{ gap: GUTTER }}>
        <Cell src={urlAt(preview, 0)} onClick={() => open(0)} rounded="rounded-tl-2xl" />
        <Cell src={urlAt(preview, 1)} onClick={() => open(1)} rounded="rounded-tr-2xl" />
        <Cell src={urlAt(preview, 2)} onClick={() => open(2)} rounded="rounded-bl-2xl" />
        <Cell
          src={urlAt(preview, 3)}
          onClick={() => open(3)}
          rounded="rounded-br-2xl"
          overlay={moreLabel}
        />
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-[280px] overflow-hidden">{grid}</div>
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
