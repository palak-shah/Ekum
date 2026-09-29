/** Where nav ＋ goes. Never a silent tap. */
export type CreateFabIntent = 'collection' | 'orders' | 'explain';

export const CREATE_FAB_EXPLAIN =
  'This login cannot add designs or start an order from here. Ask the owner on Team.';

export function createFabIntent(input: {
  selling: boolean;
  buying: boolean;
  canUploads: boolean;
  canOrders: boolean;
}): CreateFabIntent {
  if (input.selling && input.canUploads) return 'collection';
  if (!input.selling && input.buying && input.canOrders) return 'orders';
  return 'explain';
}

export function createFabHref(intent: CreateFabIntent): string | null {
  if (intent === 'collection') return '/catalog/collections/new';
  if (intent === 'orders') return '/orders';
  return null;
}
