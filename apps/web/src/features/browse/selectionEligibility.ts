import { CollectionStatus, ProductStatus } from '@ekum/domain-types';

export const SELECTION_NEEDS_PUBLISHED_TOAST =
  'Publish first — drafts and archived can’t go in Selection.';

/** Traveling Selection only accepts live published catalog rows. */
export function isPublishedForSelection(status: string | undefined): boolean {
  return status === ProductStatus.Published || status === CollectionStatus.Published;
}

export function selectionSkipToast(skipped: number, added: number): string | null {
  if (skipped < 1) return null;
  if (added < 1) return SELECTION_NEEDS_PUBLISHED_TOAST;
  return skipped === 1
    ? 'Skipped 1 that isn’t published.'
    : `Skipped ${skipped} that aren’t published.`;
}

/**
 * Gate a single toggle into traveling Selection when status is known.
 * Removing an already-selected row is always allowed.
 */
export function travelingSelectionToggleGate(input: {
  status: string | undefined;
  alreadySelected: boolean;
}): { allow: boolean; toast: string | null } {
  if (input.alreadySelected) return { allow: true, toast: null };
  if (isPublishedForSelection(input.status)) return { allow: true, toast: null };
  return { allow: false, toast: SELECTION_NEEDS_PUBLISHED_TOAST };
}
