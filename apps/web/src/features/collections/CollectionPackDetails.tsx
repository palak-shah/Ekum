import { useState } from 'react';
import { collectionFactsLine } from './collectionViewerChrome';

/**
 * Album identity under the title: tags · price, with more... on that line
 * when a description exists. The note opens under the line.
 */
export function CollectionPackDetails({
  categories,
  description,
  rateBand,
  journeyLine,
  supplierRateLabel,
  marginLabel,
}: {
  categories?: string[] | null;
  description?: string | null;
  rateBand?: string | null;
  /** Shared pack journey, e.g. “Rates are per pc. Order and dispatch per set.” */
  journeyLine?: string | null;
  /** Owner curated only — quiet Supplier ₹… cue. */
  supplierRateLabel?: string | null;
  /** Owner curated only — quiet Margin cue. */
  marginLabel?: string | null;
}) {
  const facts = collectionFactsLine(categories, rateBand);
  const about = description?.trim() || null;
  const journey = journeyLine?.trim() || null;
  const supplier = supplierRateLabel?.trim() || null;
  const margin = marginLabel?.trim() || null;
  const [open, setOpen] = useState(false);

  if (!facts && !about && !journey && !supplier && !margin) return null;

  return (
    <div className="flex flex-col gap-1 px-0.5" data-testid="collection-pack-details">
      {facts ? (
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 text-sm leading-5 text-ink" data-testid="collection-pack-facts">
            {facts}
          </p>
          {about ? (
            <button
              type="button"
              data-testid="collection-about"
              className="shrink-0 text-xs font-body leading-5 text-muted"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? 'less' : 'more...'}
            </button>
          ) : null}
        </div>
      ) : null}
      {supplier ? (
        <p className="text-xs leading-5 text-muted" data-testid="collection-pack-supplier-rate">
          {supplier}
        </p>
      ) : null}
      {margin ? (
        <p className="text-xs leading-5 text-muted" data-testid="collection-pack-margin">
          {margin}
        </p>
      ) : null}
      {journey ? (
        <p className="text-xs leading-5 text-muted" data-testid="collection-pack-journey">
          {journey}
        </p>
      ) : null}
      {about && (open || !facts) ? (
        <p
          className="whitespace-pre-wrap text-sm leading-5 text-ink"
          data-testid="collection-pack-details-description"
        >
          {about}
        </p>
      ) : null}
    </div>
  );
}
