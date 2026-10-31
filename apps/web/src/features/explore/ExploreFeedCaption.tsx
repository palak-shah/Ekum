import { cx } from '@/ui/kit';

/**
 * Explore feed caption under the photo — name · rate · tags.
 * The collection note stays on the collection page.
 */
export function ExploreFeedCaption({
  title,
  meta,
  rateLine,
  categoryLine,
  className,
}: {
  title: string;
  /** Optional; omitted on Explore feed (no N designs / activity under title). */
  meta?: string | null;
  rateLine?: string | null;
  categoryLine?: string | null;
  className?: string;
}) {
  return (
    <div className={cx('mt-0.5 flex w-full flex-col gap-0.5 text-left', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-base font-emphasis leading-normal tracking-tight text-ink">
          {title}
        </p>
        {rateLine ? (
          <p
            className="shrink-0 text-base font-emphasis leading-normal tracking-tight text-accent no-underline"
            data-testid="explore-feed-rate"
          >
            {rateLine}
          </p>
        ) : null}
      </div>
      {meta ? <p className="text-sm font-body leading-normal text-muted">{meta}</p> : null}
      {categoryLine ? (
        <p
          className="text-xs font-body leading-normal text-muted"
          data-testid="explore-feed-categories"
        >
          {categoryLine}
        </p>
      ) : null}
    </div>
  );
}
