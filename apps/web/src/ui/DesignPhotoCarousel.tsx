import { useEffect, useRef, useState } from 'react';
import { SelectableMediaFrame } from '@/ui/selectMediaChrome';
import { LONG_PRESS_SURFACE_CLASS, useLongPress } from '@/ui/useLongPress';
import { cx } from '@/ui/kit';

/**
 * Universal design photo strip: swipe sideways when a design has 2+ photos.
 * Tap (no scroll) activates; long-press optional for Select.
 */
export function DesignPhotoCarousel({
  urls,
  name,
  photoClassName,
  placeholderClassName,
  selectMode = false,
  selected = false,
  unavailableReason,
  rateOverlay,
  onActivate,
  onLongSelect,
  testId = 'design-photo-carousel',
  showDots = true,
  showExtraBadge = true,
}: {
  urls: string[];
  name: string;
  /** Applied to each photo (aspect / object-fit). */
  photoClassName: string;
  placeholderClassName?: string;
  selectMode?: boolean;
  selected?: boolean;
  unavailableReason?: string;
  rateOverlay?: string | null;
  onActivate: (photoIndex: number) => void;
  onLongSelect?: () => void;
  testId?: string;
  showDots?: boolean;
  showExtraBadge?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollLeftOnDown = useRef(0);
  const suppressScrollSync = useRef(false);
  const [viewportW, setViewportW] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const longPress = useLongPress(onLongSelect);
  const multi = urls.length > 1;
  const safeIndex = urls.length > 0 ? Math.min(photoIndex, urls.length - 1) : 0;
  const remaining = Math.max(0, urls.length - 1 - safeIndex);

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

  useEffect(() => {
    setPhotoIndex(0);
    const el = scrollerRef.current;
    if (!el) return;
    suppressScrollSync.current = true;
    if (typeof el.scrollTo === 'function') el.scrollTo({ left: 0, behavior: 'auto' });
    else el.scrollLeft = 0;
    const t = window.setTimeout(() => {
      suppressScrollSync.current = false;
    }, 40);
    return () => window.clearTimeout(t);
  }, [urls.join('|')]);

  const activateLabel = selectMode ? `Select ${name}` : name;

  if (urls.length < 1) {
    return (
      <button
        type="button"
        aria-label={activateLabel}
        onClick={() => onActivate(0)}
        className={cx('relative block w-full', LONG_PRESS_SURFACE_CLASS)}
        {...longPress}
        data-testid={testId}
      >
        <SelectableMediaFrame
          selectMode={selectMode && !unavailableReason}
          selected={selected}
          checkClassName="right-2 top-2"
        >
          <div className={placeholderClassName ?? photoClassName}>
            {name.charAt(0).toUpperCase() || '·'}
          </div>
        </SelectableMediaFrame>
      </button>
    );
  }

  if (!multi) {
    return (
      <button
        type="button"
        aria-label={activateLabel}
        onClick={() => onActivate(0)}
        className={cx('relative block w-full', LONG_PRESS_SURFACE_CLASS)}
        {...longPress}
        data-testid={testId}
      >
        <SelectableMediaFrame
          selectMode={selectMode && !unavailableReason}
          selected={selected}
          checkClassName="right-2 top-2"
        >
          <img
            src={urls[0]}
            alt={name}
            className={cx(photoClassName, unavailableReason && 'opacity-45')}
            loading="lazy"
          />
          {rateOverlay ? (
            <span
              className="absolute bottom-2 left-2 z-[1] rounded-md bg-ink/70 px-2 py-0.5 text-xs font-emphasis text-white"
              data-testid="design-photo-rate"
            >
              {rateOverlay}
            </span>
          ) : null}
          {unavailableReason ? (
            <span className="absolute left-2 top-2 z-[1] rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-bold text-white">
              {unavailableReason}
            </span>
          ) : null}
        </SelectableMediaFrame>
      </button>
    );
  }

  return (
    <div className={cx('relative w-full', LONG_PRESS_SURFACE_CLASS)} {...longPress}>
      <SelectableMediaFrame
        selectMode={selectMode && !unavailableReason}
        selected={selected}
        checkClassName="right-2 top-2"
      >
        <div
          ref={scrollerRef}
          data-testid={testId}
          data-photo-index={safeIndex}
          className={cx(
            'flex w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden',
            'touch-pan-x overscroll-x-contain',
            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
          onScroll={() => {
            if (suppressScrollSync.current) return;
            const el = scrollerRef.current;
            if (!el || el.clientWidth < 1) return;
            const next = Math.round(el.scrollLeft / el.clientWidth);
            if (next !== safeIndex && next >= 0 && next < urls.length) setPhotoIndex(next);
          }}
          onPointerDown={() => {
            scrollLeftOnDown.current = scrollerRef.current?.scrollLeft ?? 0;
          }}
          onClick={() => {
            const el = scrollerRef.current;
            if (!el) return;
            if (Math.abs(el.scrollLeft - scrollLeftOnDown.current) > 8) return;
            onActivate(safeIndex);
          }}
          role="button"
          tabIndex={0}
          aria-label={
            selectMode
              ? activateLabel
              : `${name}, photo ${safeIndex + 1} of ${urls.length}. Swipe for more`
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onActivate(safeIndex);
            }
          }}
        >
          {urls.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="shrink-0 snap-center snap-always"
              style={{
                width: viewportW > 0 ? viewportW : '100%',
                minWidth: viewportW > 0 ? viewportW : '100%',
              }}
            >
              <img
                src={url}
                alt={i === safeIndex ? name : ''}
                draggable={false}
                className={cx(
                  photoClassName,
                  unavailableReason && 'opacity-45',
                  'pointer-events-none select-none',
                )}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        {rateOverlay ? (
          <span
            className="pointer-events-none absolute bottom-2 left-2 z-[1] rounded-md bg-ink/70 px-2 py-0.5 text-xs font-emphasis text-white"
            data-testid="design-photo-rate"
          >
            {rateOverlay}
          </span>
        ) : null}

        {showExtraBadge && !rateOverlay ? (
          <span
            className="pointer-events-none absolute bottom-2 left-2 z-[1] rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-bold text-white"
            data-testid="collection-tile-extra-photos"
          >
            {remaining > 0 ? `+${remaining}` : `${safeIndex + 1}/${urls.length}`}
          </span>
        ) : null}

        {showDots ? (
          <div
            className="pointer-events-none absolute bottom-2 right-2 z-[1] flex items-center gap-1"
            data-testid="design-photo-dots"
            aria-hidden
          >
            {urls.map((_, i) => (
              <span
                key={i}
                className={cx(
                  'h-1 w-1 rounded-full',
                  i === safeIndex ? 'bg-white' : 'bg-white/45',
                )}
              />
            ))}
          </div>
        ) : null}

        {unavailableReason ? (
          <span className="pointer-events-none absolute left-2 top-2 z-[1] rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-bold text-white">
            {unavailableReason}
          </span>
        ) : null}
      </SelectableMediaFrame>
    </div>
  );
}
