import { useState } from 'react';
import { ChevronDownIcon } from '@/ui/icons';
import { cx } from '@/lib/cx';
import { collectionFactsLine } from './collectionViewerChrome';

/**
 * Album identity under the title: tags · price, then the unit sentence,
 * then description behind About this collection.
 */
export function CollectionPackDetails({
  categories,
  description,
  rateBand,
  journeyLine,
}: {
  categories?: string[] | null;
  description?: string | null;
  rateBand?: string | null;
  /** Shared pack journey, e.g. “Rates are per pc. Order and dispatch per set.” */
  journeyLine?: string | null;
}) {
  const facts = collectionFactsLine(categories, rateBand);
  const about = description?.trim() || null;
  const journey = journeyLine?.trim() || null;
  const [open, setOpen] = useState(false);

  if (!facts && !about && !journey) return null;

  return (
    <div className="flex flex-col gap-1 px-0.5" data-testid="collection-pack-details">
      {facts ? (
        <p className="text-sm leading-5 text-ink" data-testid="collection-pack-facts">
          {facts}
        </p>
      ) : null}
      {journey ? (
        <p className="text-xs leading-5 text-muted" data-testid="collection-pack-journey">
          {journey}
        </p>
      ) : null}
      {about ? (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            data-testid="collection-about"
            className="flex items-center gap-1 self-start text-sm font-emphasis leading-5 text-accent"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            About this collection
            <ChevronDownIcon
              width={16}
              height={16}
              className={cx('shrink-0 transition-transform', open && 'rotate-180')}
            />
          </button>
          {open ? (
            <p
              className="whitespace-pre-wrap text-sm leading-5 text-ink"
              data-testid="collection-pack-details-description"
            >
              {about}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
