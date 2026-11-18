export type OrderPartyLine = {
  /** Who is supplying · who is buying · trader on Direct. */
  label: 'supplier' | 'buyer' | 'trader';
  name: string;
  companyId: string;
  you: boolean;
};

/**
 * Role-based party lines for Order detail (no Parties header, no (you) in UI).
 * supplier = who is supplying. buyer = who is buying. trader = Direct facilitator.
 * Trader/agent desk and tri-visible tickets show supplier + buyer (+ trader on Direct).
 */
export function orderPartyLines(input: {
  direction: 'buying' | 'selling' | string;
  tradeMode: string;
  buyerName: string;
  sellerName: string;
  buyerCompanyId: string;
  sellerCompanyId: string;
  /** Reveal On / Direct Shared context where both shops are already visible. */
  triVisible?: boolean;
  facilitatorCompanyId?: string | null;
  facilitatorName?: string | null;
  viewerCompanyId?: string | null;
}): OrderPartyLine[] {
  const supplier: OrderPartyLine = {
    label: 'supplier',
    name: input.sellerName,
    companyId: input.sellerCompanyId,
    you: input.viewerCompanyId
      ? input.viewerCompanyId === input.sellerCompanyId
      : input.direction === 'selling' &&
        !(
          input.tradeMode === 'direct' &&
          input.facilitatorCompanyId &&
          input.facilitatorCompanyId !== input.sellerCompanyId
        ),
  };
  const buyer: OrderPartyLine = {
    label: 'buyer',
    name: input.buyerName,
    companyId: input.buyerCompanyId,
    you: input.viewerCompanyId
      ? input.viewerCompanyId === input.buyerCompanyId
      : input.direction === 'buying',
  };
  const traderLine =
    input.tradeMode === 'direct' && input.facilitatorCompanyId
      ? ({
          label: 'trader' as const,
          name: input.facilitatorName?.trim() || 'Trader',
          companyId: input.facilitatorCompanyId,
          you: input.viewerCompanyId === input.facilitatorCompanyId,
        } satisfies OrderPartyLine)
      : null;

  const isTraderDesk = input.tradeMode === 'manage' && input.direction === 'selling';
  if (isTraderDesk || input.triVisible || traderLine) {
    return traderLine ? [supplier, buyer, traderLine] : [supplier, buyer];
  }
  if (input.direction === 'buying') return [supplier];
  return [buyer];
}

/**
 * Which party line gets the quiet Open chat icon.
 * Direct + facilitator: Open group chat on the trader line (trio).
 * Trader/agent desk: buyer line. Single-line bilateral: that one line.
 */
export function partyLineShowsOpenChat(
  line: OrderPartyLine,
  input: Pick<
    Parameters<typeof orderPartyLines>[0],
    'direction' | 'tradeMode' | 'triVisible' | 'facilitatorCompanyId'
  >,
): boolean {
  if (input.tradeMode === 'direct' && input.facilitatorCompanyId) {
    return line.label === 'trader';
  }
  const isTraderDesk =
    input.tradeMode === 'manage' && input.direction === 'selling';
  if (isTraderDesk || input.triVisible) {
    return line.label === 'buyer';
  }
  return true;
}
