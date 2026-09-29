export type HowManyFooterSlot = 'place' | 'share' | 'ask' | 'order-buyer';

/** Place + Share first; Ask / Order for buyer stay the quieter row. */
export function howManyFooterSlots(opts: {
  showPlaceOrderAsk: boolean;
  canOrderForBuyer: boolean;
}): HowManyFooterSlot[] {
  if (opts.showPlaceOrderAsk) {
    return opts.canOrderForBuyer
      ? ['place', 'share', 'ask', 'order-buyer']
      : ['place', 'share', 'ask'];
  }
  return opts.canOrderForBuyer ? ['order-buyer', 'share'] : ['share'];
}
