const DEFAULT_QTY = '100';

export function orderBuilderPhotoDirty(input: {
  uploading: boolean;
  note: string;
  photosCount: number;
  sellerId: string;
}): boolean {
  if (input.uploading) return true;
  if (input.note.trim()) return true;
  if (input.photosCount > 0) return true;
  if (input.sellerId.trim()) return true;
  return false;
}

export function orderBuilderStandardDirty(input: {
  uploading: boolean;
  note: string;
  sellerId: string;
  sellerFromUrl: string;
  lines: { productId: string; quantity: string }[];
  initialQuantities: Record<string, string>;
}): boolean {
  if (input.uploading) return true;
  if (input.note.trim()) return true;
  if (!input.sellerFromUrl && input.sellerId.trim()) return true;
  for (const line of input.lines) {
    const initial = input.initialQuantities[line.productId] ?? DEFAULT_QTY;
    if (line.quantity !== initial) return true;
  }
  return false;
}
