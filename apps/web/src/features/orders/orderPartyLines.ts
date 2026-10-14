export type OrderPartyLine = {
  label: 'Purchase party' | 'Sales party';
  name: string;
  companyId: string;
  you: boolean;
};

/**
 * Role-based party lines for Order detail (no Parties header, no (you) in UI).
 * Purchase party = shop you buy from (supplier). Sales party = shop you sell to (customer).
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
    name: input.sellerName,
    companyId: input.sellerCompanyId,
    you: input.direction === 'selling',
  };
  const sales: OrderPartyLine = {
    label: 'Sales party',
    name: input.buyerName,
    companyId: input.buyerCompanyId,
    you: input.direction === 'buying',
  };
  const isTrader =
    input.tradeMode === 'manage' && input.direction === 'selling';
  if (isTrader || input.triVisible) {
    return [purchase, sales];
  }
  if (input.direction === 'buying') return [purchase];
  return [sales];
}

/**
 * Which party line gets the quiet Open chat icon (buyer↔trader thread).
 * Trader desk: Sales party (buyer). Single-line bilateral: that one line.
 */
export function partyLineShowsOpenChat(
  line: OrderPartyLine,
  input: Pick<Parameters<typeof orderPartyLines>[0], 'direction' | 'tradeMode' | 'triVisible'>,
): boolean {
  const isTraderDesk =
    input.tradeMode === 'manage' && input.direction === 'selling';
  if (isTraderDesk || input.triVisible) {
    return line.label === 'Sales party';
  }
  return true;
}
