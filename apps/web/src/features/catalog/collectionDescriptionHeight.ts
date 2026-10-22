/** One kit row floor / multi-line cap for collection Description. */
export const COLLECTION_DESC_MIN_PX = 40;
export const COLLECTION_DESC_MAX_PX = 144;

/** Clamp measured scrollHeight into the Description grow range. */
export function collectionDescriptionHeightPx(scrollHeight: number): number {
  if (!Number.isFinite(scrollHeight) || scrollHeight <= 0) return COLLECTION_DESC_MIN_PX;
  return Math.min(Math.max(Math.ceil(scrollHeight), COLLECTION_DESC_MIN_PX), COLLECTION_DESC_MAX_PX);
}
