import { cx } from '@/ui/kit';

/**
 * Explore feed caption under the photo — name · rate · tags.
 * Owner/viewerReposted: quiet Supplier or Margin under title; Fabric left on that row.
 * The collection note stays on the collection page.
 */
export function ExploreFeedCaption({
  title,
  meta,
  rateLine,
  supplierRateLabel,
  marginLabel,
  categoryLine,
  className,
}: {
  title: string;
  /** Quiet activity when `exploreNewDesignCount` > 0; omit otherwise. */
  meta?: string | null;
  rateLine?: string | null;
  /** Viewer-only: Supplier ₹… (Edit mode). */
  supplierRateLabel?: string | null;
  /** Viewer-only: Margin … (±Margin mode only). */
  marginLabel?: string | null;
  categoryLine?: string | null;
  className?: string;
}) {
  const supplier = supplierRateLabel?.trim() || null;
  const margin = marginLabel?.trim() || null;
  const categories = categoryLine?.trim() || null;
  const quietChrome = supplier || margin;
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
      {categories || quietChrome ? (
        <div className="flex items-start justify-between gap-3">
          {categories ? (
            <p
              className="min-w-0 flex-1 text-xs font-body leading-normal text-muted"
              data-testid="explore-feed-categories"
            >
              {categories}
            </p>
          ) : (
            <span className="min-w-0 flex-1" />
          )}
          {quietChrome ? (
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              {supplier ? (
                <p
                  className="text-xs font-body leading-normal text-muted"
                  data-testid="explore-feed-supplier-rate"
                >
                  {supplier}
                </p>
              ) : null}
              {margin ? (
                <p
                  className="text-xs font-body leading-normal text-muted"
                  data-testid="explore-feed-margin"
                >
                  {margin}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {meta ? <p className="text-sm font-body leading-normal text-muted">{meta}</p> : null}
    </div>
  );
}
