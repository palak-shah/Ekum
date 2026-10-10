import { cx } from '@/lib/cx';
import type {
  CollectionPackDetailKey,
  CollectionPackDetailSection,
} from './collectionViewerChrome';

/** Label above, body below — shared by pack details and design photos sheet. */
export function PackDetailBlocks({
  sections,
  testIdPrefix = 'collection-pack-details',
  unlabeledKeys,
}: {
  sections: CollectionPackDetailSection[];
  testIdPrefix?: string;
  /** Keys rendered as body only (no section title). */
  unlabeledKeys?: readonly CollectionPackDetailKey[];
}) {
  if (sections.length === 0) return null;
  const hideLabel = new Set(unlabeledKeys ?? []);
  return (
    <div className="flex flex-col gap-2.5">
      {sections.map((section) => {
        const showLabel = !hideLabel.has(section.key);
        return (
          <div key={section.key} data-testid={`${testIdPrefix}-${section.key}`}>
            {showLabel ? (
              <p className="text-sm font-semibold leading-5 text-ink">{section.label}</p>
            ) : null}
            <p
              className={cx(
                // leading-5 keeps collapsed max-height on whole line boxes (BM-07).
                'text-sm font-medium leading-5',
                showLabel ? 'text-muted' : 'text-ink',
                section.key === 'description' && 'whitespace-pre-wrap',
              )}
            >
              {section.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}
