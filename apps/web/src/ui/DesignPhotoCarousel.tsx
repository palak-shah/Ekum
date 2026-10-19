import { useEffect, useRef, useState } from 'react';
import { SelectableMediaFrame } from '@/ui/selectMediaChrome';
import { ChevronRightIcon } from '@/ui/icons';
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
  onIndexChange,
  priority = false,
  endCard,
  showArrows = false,
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
  /** Current slide, including the reset to 0 when the photo set changes. */
  onIndexChange?: (index: number) => void;
  /** First photo loads immediately (above-the-fold Explore cards). */
  priority?: boolean;
  /** Extra last slide when more designs exist than this strip shows. */
  endCard?: { extraCount: number; testId?: string } | null;
  /** Side arrows when another slide is in that direction. */
  showArrows?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollLeftOnDown = useRef(0);
  const suppressScrollSync = useRef(false);
  const [viewportW, setViewportW] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const longPress = useLongPress(onLongSelect);
  const slideCount = urls.length + (endCard ? 1 : 0);
  const multi = slideCount > 1;
  const safeIndex = slideCount > 0 ? Math.min(photoIndex, slideCount - 1) : 0;
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

  useEffect(() => {
    onIndexChange?.(safeIndex);
  }, [safeIndex, onIndexChange]);

  const activateLabel = selectMode ? `Select ${name}` : name;
  const endLabel = endCard
    ? `+${endCard.extraCount} ${endCard.extraCount === 1 ? 'more design' : 'more designs'}`
    : '';

  const scrollToIndex = (index: number) => {
    const el = scrollerRef.current;
    const next = Math.min(Math.max(index, 0), slideCount - 1);
    setPhotoIndex(next);
    if (!el) return;
    suppressScrollSync.current = true;
    const left = next * (el.clientWidth || 0);
    if (typeof el.scrollTo === 'function') el.scrollTo({ left, behavior: 'smooth' });
    else el.scrollLeft = left;
    window.setTimeout(() => {
      suppressScrollSync.current = false;
    }, 350);
  };

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
            loading={priority ? 'eager' : 'lazy'}
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
            if (next !== safeIndex && next >= 0 && next < slideCount) setPhotoIndex(next);
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
            endCard && safeIndex >= urls.length
              ? `${endLabel}. View collection`
              : selectMode
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
                loading={i === 0 || priority ? 'eager' : 'lazy'}
              />
            </div>
          ))}
          {endCard ? (
            <div
              className="shrink-0 snap-center snap-always"
              style={{
                width: viewportW > 0 ? viewportW : '100%',
                minWidth: viewportW > 0 ? viewportW : '100%',
              }}
            >
              <button
                type="button"
                data-testid={endCard.testId ?? 'design-photo-end-card'}
                className={cx(
                  photoClassName,
                  'flex flex-col items-center justify-center gap-1.5 rounded-xl bg-foam px-4',
                )}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onActivate(urls.length);
                }}
              >
                <span className="text-3xl font-emphasis leading-none tracking-tight text-accent">
                  +{endCard.extraCount}
                </span>
                <span className="text-sm font-body text-muted">
                  {endCard.extraCount === 1 ? 'more design' : 'more designs'}
                </span>
                <span className="mt-2 rounded-full bg-surface px-3.5 py-1.5 text-sm font-emphasis text-accent">
                  View collection
                </span>
              </button>
            </div>
          ) : null}
        </div>

        {showArrows && multi && safeIndex > 0 ? (
          <button
            type="button"
            aria-label="Previous photo"
            data-testid="explore-photo-prev"
            className="absolute left-2 top-1/2 z-[2] flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/55 text-ink/70 backdrop-blur-[2px]"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              scrollToIndex(safeIndex - 1);
            }}
          >
            <ChevronRightIcon width={14} height={14} className="rotate-180" />
          </button>
        ) : null}
        {showArrows && multi && safeIndex < slideCount - 1 ? (
          <button
            type="button"
            aria-label="Next photo"
            data-testid="explore-photo-next"
            className="absolute right-2 top-1/2 z-[2] flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/55 text-ink/70 backdrop-blur-[2px]"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              scrollToIndex(safeIndex + 1);
            }}
          >
            <ChevronRightIcon width={14} height={14} />
          </button>
        ) : null}

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
