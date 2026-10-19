export type OrderPartyLine = {
  /** Who is supplying · who is buying. */
  label: 'supplier' | 'buyer';
  name: string;
  companyId: string;
  you: boolean;
};

/**
 * Role-based party lines for Order detail (no Parties header, no (you) in UI).
 * supplier = who is supplying. buyer = who is buying.
 * Trader/agent desk and tri-visible tickets show both shops.
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
  const supplier: OrderPartyLine = {
    label: 'supplier',
    name: input.sellerName,
    companyId: input.sellerCompanyId,
    you: input.direction === 'selling',
  };
  const buyer: OrderPartyLine = {
    label: 'buyer',
    name: input.buyerName,
    companyId: input.buyerCompanyId,
    you: input.direction === 'buying',
  };
  const isTrader =
    input.tradeMode === 'manage' && input.direction === 'selling';
  if (isTrader || input.triVisible) {
    return [supplier, buyer];
  }
  if (input.direction === 'buying') return [supplier];
  return [buyer];
}

/**
 * Which party line gets the quiet Open chat icon (buyer↔trader/agent thread).
 * Trader/agent desk: buyer line. Single-line bilateral: that one line.
 */
export function partyLineShowsOpenChat(
  line: OrderPartyLine,
  input: Pick<Parameters<typeof orderPartyLines>[0], 'direction' | 'tradeMode' | 'triVisible'>,
): boolean {
  const isTraderDesk =
    input.tradeMode === 'manage' && input.direction === 'selling';
  if (isTraderDesk || input.triVisible) {
    return line.label === 'buyer';
  }
  return true;
}
