/**
 * Mosaic layout uses available thumbs only (never empty cells).
 * +N is leftover designs after the four cells, not extra photos / cover.
 */
export function collectionMosaicCount(input: {
  productCount: number;
  previewCount: number;
}): number {
  if (input.previewCount < 4) return input.previewCount;
  return Math.max(input.productCount, input.previewCount);
}

/** Fourth-cell overlay. Null when everything fits in four thumbs. */
export function albumOverflowLabel(total: number): string | null {
  if (total <= 4) return null;
  return `+${total - 4}`;
}
