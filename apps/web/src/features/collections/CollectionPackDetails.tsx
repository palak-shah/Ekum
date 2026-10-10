import { useLayoutEffect, useRef, useState } from 'react';
import { cx } from '@/lib/cx';
import {
  collectionPackDetailSections,
  noteBlockOverflows,
  PACK_DETAILS_COLLAPSED_MAX_H_CLASS,
} from './collectionViewerChrome';
import { PackDetailBlocks } from './PackDetailBlocks';

export function CollectionPackDetails({
  categories,
  description,
  rateBand,
}: {
  categories?: string[] | null;
  description?: string | null;
  rateBand?: string | null;
}) {
  const sections = collectionPackDetailSections({ categories, description, rateBand });
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (open) return;
    const el = bodyRef.current;
    if (!el) {
      setOverflows(false);
      return;
    }
    setOverflows(noteBlockOverflows(el.scrollHeight, el.clientHeight));
  }, [open, categories, description, rateBand]);

  if (sections.length === 0) return null;

  const showToggle = open || overflows;

  return (
    <div className="px-0.5" data-testid="collection-pack-details">
      <div
        ref={bodyRef}
        className={cx(
          // Whole line boxes only — never mid-glyph clip (BM-07).
          !open && cx(PACK_DETAILS_COLLAPSED_MAX_H_CLASS, 'overflow-hidden'),
        )}
      >
        <PackDetailBlocks
          sections={sections}
          unlabeledKeys={['rate', 'description']}
        />
      </div>
      {showToggle ? (
        <button
          type="button"
          data-testid="collection-pack-details-more"
          className="mt-1 text-sm font-semibold leading-normal text-accent"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Show less' : 'read more'}
        </button>
      ) : null}
    </div>
  );
}
