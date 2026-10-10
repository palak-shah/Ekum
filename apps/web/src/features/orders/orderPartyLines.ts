export type OrderPartyLine = {
  label: 'Purchase party' | 'Selling party';
  name: string;
  companyId: string;
  you: boolean;
};

/**
 * Role-based party lines for Order detail (no Parties header, no (you) in UI).
 * Trader desk and tri-visible tickets show both shops.
 */
export function orderPartyLines(input: {
  direction: 'buying' | 'selling' | string;
  tradeMode: string;
  buyerName: string;
  sellerName: string;
  buyerCompanyId: string;
  sellerCompanyId: string;
  /** Reveal On / Shared context where both shops are already visible. */
  triVisible?: boolean;
}): OrderPartyLine[] {
  const purchase: OrderPartyLine = {
    label: 'Purchase party',
    name: input.buyerName,
    companyId: input.buyerCompanyId,
    you: input.direction === 'buying',
  };
  const selling: OrderPartyLine = {
    label: 'Selling party',
    name: input.sellerName,
    companyId: input.sellerCompanyId,
    you: input.direction === 'selling',
  };
  const isTrader =
    input.tradeMode === 'manage' && input.direction === 'selling';
  if (isTrader || input.triVisible) {
    return [purchase, selling];
  }
  if (input.direction === 'buying') return [selling];
  return [purchase];
}
