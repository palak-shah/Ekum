import { useEffect, useRef, useState } from 'react';
import { BackIcon, ChevronRightIcon } from '@/ui/icons';
import { PHOTO_STRIP_TOUCH_CLASS } from '@/ui/mobileOverflow';
import { cx } from '@/ui/kit';

/**
 * Design photos in the collection sheet.
 * - Swipe the photo sideways (native horizontal scroll + snap)
 * - Or tap ◀ ▶ / the dots below
 * - Tap the photo (without dragging) opens fullscreen
 */
export function DesignSheetPhotoCarousel({
  urls,
  index,
  onIndex,
  onOpenFullscreen,
}: {
  urls: string[];
  index: number;
  onIndex: (index: number) => void;
  onOpenFullscreen: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const suppressScrollSync = useRef(false);
  const scrollLeftOnDown = useRef(0);
  const [viewportW, setViewportW] = useState(0);
  const safeIndex = urls.length > 0 ? Math.min(index, urls.length - 1) : 0;
  const multi = urls.length > 1;

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () => setViewportW(el.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [urls.length]);

  // Keep scroll position in sync when index changes (chevrons / dots / parent).
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || viewportW < 1) return;
    const target = safeIndex * viewportW;
    if (Math.abs(el.scrollLeft - target) < 2) return;
    suppressScrollSync.current = true;
    el.scrollTo({ left: target, behavior: 'smooth' });
    const t = window.setTimeout(() => {
      suppressScrollSync.current = false;
    }, 280);
    return () => window.clearTimeout(t);
  }, [safeIndex, viewportW]);

  const goTo = (next: number) => {
    if (next < 0 || next >= urls.length || next === safeIndex) return;
    onIndex(next);
  };

  if (urls.length < 1) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl bg-foam text-muted">
        No photos
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full">
        <div
          ref={scrollerRef}
          data-testid="collection-design-photo-carousel"
          data-photo-index={safeIndex}
          role="group"
          aria-roledescription="carousel"
          aria-label={
            multi
              ? `Design photos, ${safeIndex + 1} of ${urls.length}. Swipe or use arrows. Tap photo to enlarge`
              : 'Design photo. Tap to enlarge'
          }
          className={cx(
            'flex max-h-[min(70dvh,28rem)] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-2xl bg-foam',
            PHOTO_STRIP_TOUCH_CLASS,
            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
          onScroll={() => {
            if (suppressScrollSync.current) return;
            const el = scrollerRef.current;
            if (!el || el.clientWidth < 1) return;
            const next = Math.round(el.scrollLeft / el.clientWidth);
            if (next !== safeIndex && next >= 0 && next < urls.length) onIndex(next);
          }}
          onPointerDown={() => {
            scrollLeftOnDown.current = scrollerRef.current?.scrollLeft ?? 0;
          }}
          onClick={() => {
            const el = scrollerRef.current;
            if (!el) return;
            if (Math.abs(el.scrollLeft - scrollLeftOnDown.current) > 8) return;
            onOpenFullscreen();
          }}
        >
          {urls.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="flex shrink-0 snap-center snap-always items-center justify-center"
              style={{
                width: viewportW > 0 ? viewportW : '100%',
                minWidth: viewportW > 0 ? viewportW : '100%',
              }}
              data-testid={i === safeIndex ? 'collection-design-photo-slide-active' : undefined}
              aria-hidden={i !== safeIndex}
            >
              <img
                src={url}
                alt=""
                draggable={false}
                className="pointer-events-none max-h-[min(70dvh,28rem)] w-full select-none object-contain"
              />
            </div>
          ))}
        </div>

        {multi ? (
          <>
            <button
              type="button"
              data-testid="collection-design-photo-prev"
              aria-label="Previous photo"
              disabled={safeIndex <= 0}
              onClick={(event) => {
                event.stopPropagation();
                goTo(safeIndex - 1);
              }}
              className={cx(
                'absolute left-1.5 top-1/2 z-[1] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/55 text-white shadow-sm',
                'disabled:pointer-events-none disabled:opacity-0',
              )}
            >
              <BackIcon width={22} height={22} />
            </button>
            <button
              type="button"
              data-testid="collection-design-photo-next"
              aria-label="Next photo"
              disabled={safeIndex >= urls.length - 1}
              onClick={(event) => {
                event.stopPropagation();
                goTo(safeIndex + 1);
              }}
              className={cx(
                'absolute right-1.5 top-1/2 z-[1] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/55 text-white shadow-sm',
                'disabled:pointer-events-none disabled:opacity-0',
              )}
            >
              <ChevronRightIcon width={22} height={22} />
            </button>
            <p
              className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-ink/55 px-2 py-0.5 text-[11px] font-emphasis text-white"
              data-testid="collection-design-photo-count"
            >
              {safeIndex + 1} / {urls.length}
            </p>
          </>
        ) : null}
      </div>

      {multi ? (
        <div
          className="flex items-center justify-center gap-2"
          data-testid="collection-design-photo-dots"
        >
          {urls.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Photo ${i + 1}`}
              aria-current={i === safeIndex ? 'true' : undefined}
              data-testid={
                i === safeIndex
                  ? 'collection-design-photo-dot-active'
                  : `collection-design-photo-dot-${i}`
              }
              onClick={() => goTo(i)}
              className="flex h-6 w-6 items-center justify-center"
            >
              <span
                className={cx(
                  'h-1.5 w-1.5 rounded-full',
                  i === safeIndex ? 'bg-ink' : 'bg-line',
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
