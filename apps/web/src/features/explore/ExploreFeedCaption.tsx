import { useLayoutEffect, useRef, useState } from 'react';
import {
  noteBlockOverflows,
  PACK_DETAILS_COLLAPSED_MAX_H_CLASS,
} from '@/features/collections/collectionViewerChrome';
import { exploreFeedAboutText } from '@/features/explore/exploreFeedCaptionLines';
import { useExploreFeedRemeasure } from '@/features/explore/exploreFeedMeasure';
import { cx } from '@/ui/kit';

/**
 * Explore feed caption under mosaic — title · rate · tags · optional description.
 * Description matches album pack details: clamp + read more on the last line.
 * Remasures the virtual feed when clamp / expand changes (avoids blank gaps).
 */
export function ExploreFeedCaption({
  title,
  meta,
  rateLine,
  categoryLine,
  about,
  className,
}: {
  title: string;
  /** Optional; omitted on Explore feed (no N designs / activity under title). */
  meta?: string | null;
  rateLine?: string | null;
  categoryLine?: string | null;
  about?: string | null;
  className?: string;
}) {
  const aboutText = exploreFeedAboutText(about);

  return (
    <div className={cx('mt-1 flex w-full flex-col gap-2 text-left', className)}>
      <p className="text-base font-semibold leading-normal tracking-tight text-ink">{title}</p>
      {meta ? <p className="text-sm font-medium leading-normal text-muted">{meta}</p> : null}
      {rateLine ? (
        <p
          className="text-base font-semibold leading-normal tracking-tight text-accent"
          data-testid="explore-feed-rate"
        >
          {rateLine}
        </p>
      ) : null}
      {categoryLine ? (
        <p
          className="text-sm font-medium leading-normal text-muted"
          data-testid="explore-feed-categories"
        >
          {categoryLine}
        </p>
      ) : null}
      {aboutText ? <ExploreFeedDescription text={aboutText} /> : null}
    </div>
  );
}

function ExploreFeedDescription({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const remeasure = useExploreFeedRemeasure();

  useLayoutEffect(() => {
    if (open) return;
    const el = bodyRef.current;
    if (!el) {
      setOverflows(false);
      return;
    }
    setOverflows(noteBlockOverflows(el.scrollHeight, el.clientHeight));
  }, [open, text]);

  // Remasure only when expand/collapse changes height — not on toggle-chrome paint
  // (absolute “read more” does not change row height; thrashing scrollMargin/gaps).
  useLayoutEffect(() => {
    remeasure();
  }, [open, remeasure]);

  const showToggle = open || overflows;

  return (
    <div
      className={cx('relative', !open && 'max-h-[3.75rem] overflow-hidden')}
      data-testid="explore-feed-about-block"
    >
      <p
        ref={bodyRef}
        data-testid="explore-feed-about-body"
        className={cx(
          'text-sm font-medium leading-5 text-ink whitespace-pre-wrap',
          /* Literal max-h so JIT always emits; reserve space so read more doesn’t cover glyphs. */
          !open && cx(PACK_DETAILS_COLLAPSED_MAX_H_CLASS, 'overflow-hidden', 'pr-16'),
        )}
      >
        {text}
      </p>
      {showToggle ? (
        <button
          type="button"
          data-testid="explore-feed-about"
          className={cx(
            'text-sm font-semibold leading-5 text-accent',
            open
              ? 'mt-1'
              : 'absolute bottom-0 right-0 z-[1] bg-gradient-to-l from-canvas from-50% to-transparent pl-6',
          )}
          aria-expanded={open}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          {open ? 'Show less' : 'read more'}
        </button>
      ) : null}
    </div>
  );
}
