export type OrderWhoMode = 'hidden' | 'for-me-default' | 'buyer-only';

/** Drives quantity-sheet CTAs: buyer-only vs place-order vs both (selling/trading). */
export function orderWhoMode(options: {
  canLogForBuyer: boolean;
  actorCompanyId: string;
  productCompanyIds: string[];
}): OrderWhoMode {
  if (!options.canLogForBuyer || !options.actorCompanyId) return 'hidden';
  const hasForeign = options.productCompanyIds.some((id) => id && id !== options.actorCompanyId);
  return hasForeign ? 'for-me-default' : 'buyer-only';
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
