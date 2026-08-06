import { useEffect, useState, type ReactNode } from 'react';
import { cx } from '@/ui/kit';

const GUTTER = 2;

function urlAt(urls: string[], index: number): string {
  const url = urls[index];
  if (!url) {
    throw new Error('Missing photo URL');
  }
  return url;
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
        <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-2xl font-semibold text-white">
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
  const preview = urls.slice(0, 4);

  useEffect(() => {
    if (viewerIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewerIndex(null);
      if (event.key === 'ArrowRight' && viewerIndex < urls.length - 1) {
        setViewerIndex(viewerIndex + 1);
      }
      if (event.key === 'ArrowLeft' && viewerIndex > 0) {
        setViewerIndex(viewerIndex - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerIndex, urls.length]);

  if (urls.length === 0) return null;

  const open = (index: number) => setViewerIndex(index);
  const extra = Math.max(0, urls.length - preview.length) + Math.max(0, overflowCount);
  const count = preview.length;

  let grid: ReactNode;
  if (count === 1) {
    grid = (
      <button
        type="button"
        onClick={() => open(0)}
        className="block w-full overflow-hidden rounded-2xl bg-foam"
      >
        <img
          src={urlAt(preview, 0)}
          alt=""
          className="max-h-72 w-full object-cover"
        />
      </button>
    );
  } else if (count === 2) {
    grid = (
      <div className="grid h-40 grid-cols-2" style={{ gap: GUTTER }}>
        <Cell src={urlAt(preview, 0)} onClick={() => open(0)} rounded="rounded-l-2xl" />
        <Cell src={urlAt(preview, 1)} onClick={() => open(1)} rounded="rounded-r-2xl" />
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
          <Cell src={urlAt(preview, 2)} onClick={() => open(2)} rounded="rounded-br-2xl" />
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
          overlay={extra > 0 ? `+${extra}` : undefined}
        />
      </div>
    );
  }

  const viewerSrc = viewerIndex !== null ? urls[viewerIndex] : undefined;

  return (
    <>
      <div className="w-full max-w-[280px] overflow-hidden">{grid}</div>
      {viewerIndex !== null && viewerSrc ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-ink/92"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-sm font-medium hover:bg-white/10"
              onClick={() => setViewerIndex(null)}
            >
              Close
            </button>
            <p className="text-sm text-white/80">
              {viewerIndex + 1} / {urls.length}
            </p>
            <span className="w-16" />
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6">
            {viewerIndex > 0 ? (
              <button
                type="button"
                aria-label="Previous photo"
                className="absolute left-2 rounded-full bg-white/15 px-3 py-2 text-white hover:bg-white/25"
                onClick={() => setViewerIndex(viewerIndex - 1)}
              >
                ‹
              </button>
            ) : null}
            <img src={viewerSrc} alt="" className="max-h-full max-w-full object-contain" />
            {viewerIndex < urls.length - 1 ? (
              <button
                type="button"
                aria-label="Next photo"
                className="absolute right-2 rounded-full bg-white/15 px-3 py-2 text-white hover:bg-white/25"
                onClick={() => setViewerIndex(viewerIndex + 1)}
              >
                ›
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
