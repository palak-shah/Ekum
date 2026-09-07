import {
  isPublishedForSelection,
  selectionSkipToast,
} from './selectionEligibility';

/** Split catalog rows for To selection — published go; rest are skipped with toast. */
export function partitionForTravelingSelection<T extends { status: string }>(
  rows: T[],
): { published: T[]; skipped: number; toast: string | null } {
  const published = rows.filter((row) => isPublishedForSelection(row.status));
  const skipped = rows.length - published.length;
  return {
    published,
    skipped,
    toast: selectionSkipToast(skipped, published.length),
  };
}
