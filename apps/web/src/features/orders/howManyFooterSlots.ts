export type HowManyFooterSlot = 'place' | 'ask' | 'order-buyer-toggle';

/**
 * Order job: Place (+ optional Order for buyer switch). No Share / Ask.
 * Ask job: Ask rates only.
 */
export function howManyFooterSlots(opts: {
  sheetJob: 'order' | 'ask';
  showPlaceOrder: boolean;
  canOrderForBuyer: boolean;
}): HowManyFooterSlot[] {
  if (opts.sheetJob === 'ask') return ['ask'];
  if (opts.showPlaceOrder) {
    return opts.canOrderForBuyer ? ['order-buyer-toggle', 'place'] : ['place'];
  }
  return opts.canOrderForBuyer ? ['order-buyer-toggle'] : [];
}
