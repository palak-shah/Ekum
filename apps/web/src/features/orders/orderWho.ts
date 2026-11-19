export type OrderWhoMode = 'hidden' | 'for-me-default' | 'buyer-only';

/**
 * Drives quantity-sheet CTAs: buyer-only vs place-order vs both (selling/trading).
 * Peer packs always stay placeable; `canLogForBuyer` only gates own-shop logging
 * and the Order-for-buyer switch (followers ≥ 1).
 */
export function orderWhoMode(options: {
  canLogForBuyer: boolean;
  actorCompanyId: string;
  /** Who the order goes to — pack owner or mill shop, not mill SKU members. */
  sellerCompanyId: string;
}): OrderWhoMode {
  if (!options.actorCompanyId) return 'hidden';
  if (!options.sellerCompanyId || options.sellerCompanyId === 'multi') {
    return 'for-me-default';
  }
  if (options.sellerCompanyId === options.actorCompanyId) {
    return options.canLogForBuyer ? 'buyer-only' : 'hidden';
  }
  return 'for-me-default';
}

export function isTenDigitPhone(value: string): boolean {
  return /^\d{10}$/.test(value.trim());
}

/**
 * Order-for-buyer success. Buyer does not Accept.
 * Own catalog is already confirmed. A mill ticket waits for the supplier to Confirm.
 */
export function orderForBuyerLoggedToast(status: string): string {
  if (status === 'confirmed') return 'Logged.';
  return 'Logged. Supplier can confirm.';
}
