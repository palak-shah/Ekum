/** What the New sheet shows. The ＋ always opens the sheet — never a silent tap. */
export type CreateFabIntent = 'new-sheet' | 'orders' | 'explain';

export function createFabIntent(input: {
  selling: boolean;
  buying: boolean;
  canUploads: boolean;
  canOrders: boolean;
}): CreateFabIntent {
  if (input.selling && input.canUploads) return 'new-sheet';
  if (input.buying && input.canOrders) return 'orders';
  return 'explain';
}
