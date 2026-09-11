/** Auto name for a new collection when the seller has not typed one. */
export function defaultCollectionName(now = new Date()): string {
  const day = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${day} collection`;
}

export function nameFromFilename(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, '').replace(/\.[^.]+$/, '');
  const cleaned = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || 'Design';
}

export type CreateGridItem =
  | { kind: 'photo'; localId: string; imageUrl: string; name: string; previewUrl: string }
  | { kind: 'library'; productId: string; imageUrl: string | null; name: string };

/** Cover URL from tagged grid item (photo or library design). */
export function coverUrlFromGrid(
  items: CreateGridItem[],
  coverKey: string | null,
): string | undefined {
  if (!items.length) return undefined;
  const tagged =
    (coverKey && items.find((item) => itemKey(item) === coverKey)) || items[0];
  if (!tagged) return undefined;
  return tagged.imageUrl ?? undefined;
}

export function itemKey(item: CreateGridItem): string {
  return item.kind === 'photo' ? item.localId : item.productId;
}

/** Cap for quick photos on New / edit collection (each photo → one draft design). */
export const COLLECTION_QUICK_PHOTO_CAP = 24;

/** ContinuousCamera remaining shots while building a new collection. */
export function collectionCameraMaxShots(
  pendingPhotoCount: number,
  cap = COLLECTION_QUICK_PHOTO_CAP,
): number {
  return Math.max(0, cap - pendingPhotoCount);
}
