import { useState, type ReactNode } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';

/**
 * Explore feed caption under mosaic — title · meta · rate · tags · optional About.
 * Room between lines so the block doesn’t feel cramped on phone.
 * No View/Share CTAs; open stays on title/meta link.
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
  meta: string;
  rateLine?: string | null;
  categoryLine?: string | null;
  about?: string | null;
  className?: string;
}) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutText = about?.trim() || null;

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
      {aboutText ? (
        <AboutThisCollection open={aboutOpen} onToggle={() => setAboutOpen((v) => !v)}>
          {aboutText}
        </AboutThisCollection>
      ) : null}
    </div>
  );
}

function AboutThisCollection({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        data-testid="explore-feed-about"
        className="inline-flex items-center gap-0.5 text-sm font-semibold leading-normal text-accent"
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggle();
        }}
      >
        About this collection
        {open ? (
          <ChevronUpIcon className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <ChevronDownIcon className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>
      {open ? (
        <p
          className="mt-1.5 text-sm font-medium leading-normal text-muted"
          data-testid="explore-feed-about-body"
        >
          {children}
        </p>
      ) : null}
    </div>
  );
}
