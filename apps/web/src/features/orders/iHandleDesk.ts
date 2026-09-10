import { nextOrderAction, type OrderMillDeskView, type OrderView } from '@ekum/domain-types';

export function traderDeskOrderId(order: Pick<OrderView, 'deskOrderId' | 'id'>): string {
  return order.deskOrderId ?? order.id;
}

export function isTraderMillHop(
  order: Pick<OrderView, 'downstreamOrderId' | 'direction' | 'tradeMode'>,
): boolean {
  return Boolean(order.downstreamOrderId) && order.direction === 'buying';
}

export function itemsForMill(
  items: OrderView['items'],
  group: OrderMillDeskView,
): OrderView['items'] {
  const ids = new Set(group.itemIds);
  return items.filter((item) => ids.has(item.id));
}

/** Me vs one shop name, or Mills when two+ (names listed quietly under the option). */
export function orderTicketMillLabel(
  desks: Array<{ sellerName: string }> | undefined,
  fallback: string,
): string {
  if (!desks?.length) return fallback;
  if (desks.length === 1) return desks[0]!.sellerName;
  return 'Mills';
}

/** Quiet under-lines for the mill flip option (2+ shops). Empty when one or none. */
export function orderTicketMillNames(
  desks: Array<{ sellerName: string }> | undefined,
): string[] {
  if (!desks || desks.length < 2) return [];
  return desks.map((desk) => desk.sellerName).filter(Boolean);
}

export function millCue(group: OrderMillDeskView): string | null {
  if (group.declinedCount && group.confirmedCount) {
    return `${group.confirmedCount} confirmed · ${group.declinedCount} can’t supply`;
  }
  if (group.declinedCount) return `${group.declinedCount} can’t supply`;
  if (group.millQuoted && !group.held) return null;
  return null;
}

/** Mill hop still needs ship/close — Settled / Dispatched are done. */
export function millNeedsDispatch(desk: Pick<OrderMillDeskView, 'held' | 'status'>): boolean {
  if (desk.held) return false;
  const done = new Set(['settled', 'dispatched', 'delivered', 'cancelled', 'declined']);
  return !done.has(desk.status);
}

/**
 * I-handle desk: Confirm locks Meena before the mill has the lot.
 * Mill Send lives on the mill card.
 */
export function showSellerConfirmOnDesk(
  millDesks: OrderView['millDesks'] | undefined,
): boolean {
  return !(millDesks && millDesks.length > 0);
}

/**
 * I-handle desk: Open chat / Decline / payment / dispatch / settle / View under Desk tools.
 * Send quote stays on the face only after a mill has quoted (rates pass) — **unless Mills observe**.
 * Quoting Meena without asking the mill → Desk tools only.
 */
export function traderActionsBehindTakeOver(
  millDesks: OrderView['millDesks'] | undefined,
): boolean {
  return Boolean(millDesks?.length);
}

/**
 * Trader Desk cue / Desk tools / mill Send — only when **selling** the Manage parent
 * that has mill desks. Reveal ON may attach millDesks for the **buyer** (identity);
 * that must not flip them into trader ops (BM-09).
 */
export function isTraderDeskOperator(
  direction: string | null | undefined,
  millDesks: OrderView['millDesks'] | undefined,
): boolean {
  return direction === 'selling' && Boolean(millDesks?.length);
}

/** Fold face CTAs under Desk tools — seller desk only. */
export function orderDetailBehindTakeOver(
  direction: string | null | undefined,
  millDesks: OrderView['millDesks'] | undefined,
): boolean {
  return isTraderDeskOperator(direction, millDesks) && traderActionsBehindTakeOver(millDesks);
}

/** Attention banner: trader mill cue vs bilateral buyer/seller cue. */
export function orderDetailNextCue(input: {
  direction: string;
  status: string;
  counterpartName: string;
  hasSellerQuote?: boolean;
  millDesks: OrderView['millDesks'] | undefined;
  laneTicket?: string | null;
  partiallyShipped?: boolean;
  intent?: string | null;
}): string | null {
  if (isTraderDeskOperator(input.direction, input.millDesks)) {
    return traderDeskNextAction({
      status: input.status,
      counterpartName: input.counterpartName,
      hasSellerQuote: input.hasSellerQuote,
      millDesks: input.millDesks,
      laneTicket: input.laneTicket,
    });
  }
  return nextOrderAction({
    status: input.status,
    direction: input.direction === 'selling' ? 'selling' : 'buying',
    hasOpenQuotedLine: input.hasSellerQuote === true,
    partiallyShipped: input.partiallyShipped,
    intent: input.intent,
    counterpartName: input.counterpartName,
  });
}

/** Whether the Desk tools control should render — never for buyers. */
export function orderDetailTakeOverHasWork(input: {
  direction: string;
  millDesks: OrderView['millDesks'] | undefined;
  laneTicket?: string | null;
  threadId?: string | null;
  canAskPayment?: boolean;
  status: string;
  openForDispatch: boolean;
  hasRemaining: boolean;
  canSettle?: boolean;
}): boolean {
  if (!orderDetailBehindTakeOver(input.direction, input.millDesks)) return false;
  const isSeller = input.direction === 'selling';
  const observe = millsObserveMode(input.laneTicket, input.millDesks);
  return Boolean(
    input.threadId ||
      input.canAskPayment ||
      (isSeller && input.status === 'requested') ||
      (observe && input.millDesks?.some((desk) => desk.held)) ||
      (isSeller && input.openForDispatch && input.hasRemaining) ||
      (isSeller && input.canSettle),
  );
}

/** Lane ticket Mills = observe; trader ops behind Desk tools. */
export function millsObserveMode(
  laneTicket: string | null | undefined,
  millDesks: OrderView['millDesks'] | undefined,
): boolean {
  return laneTicket === 'mill' && Boolean(millDesks?.length);
}

/**
 * Face Send quote: mill has quoted (Me desk rates pass).
 * Mills observe → never on the face (under Desk tools only).
 */
export function showSendQuoteOnDeskFace(
  millDesks: OrderView['millDesks'] | undefined,
  laneTicket?: string | null,
): boolean {
  if (millsObserveMode(laneTicket, millDesks)) return false;
  return Boolean(millDesks?.some((desk) => !desk.held && desk.millQuoted));
}

/** Mill-card Send: on the card for Me; under Desk tools when Mills observe. */
export function showMillSendOnCard(
  laneTicket: string | null | undefined,
  millDesks: OrderView['millDesks'] | undefined,
  takeOverOpen: boolean,
): boolean {
  if (!millsObserveMode(laneTicket, millDesks)) return true;
  return takeOverOpen;
}

/**
 * I-handle trader desk “Your move” — not the bilateral seller quote/confirm cue.
 * Parent status stays Requested until the buyer accepts; the cue tracks mill Send / quote pass.
 */
export function traderDeskNextAction(input: {
  status: string;
  counterpartName: string;
  hasSellerQuote?: boolean;
  millDesks: OrderView['millDesks'] | undefined;
  laneTicket?: string | null;
}): string | null {
  const desks = input.millDesks;
  if (!desks?.length) return null;
  const buyer = input.counterpartName.trim() || 'them';
  const observe = millsObserveMode(input.laneTicket, desks);

  if (input.status === 'requested') {
    const unsent = desks.filter((desk) => desk.held);
    if (unsent.length > 0) {
      if (observe) return 'Desk tools to Send mill lots';
      if (unsent.length === 1) return `Your move: Send to ${unsent[0]!.sellerName}`;
      return 'Your move: Send mill lots';
    }

    const awaitingRates = desks.filter((desk) => !desk.held && !desk.millQuoted);
    if (awaitingRates.length === 1) {
      return `Waiting on ${awaitingRates[0]!.sellerName} for rates`;
    }
    if (awaitingRates.length > 1) return 'Waiting on mills for rates';

    if (showSendQuoteOnDeskFace(desks, input.laneTicket) && !input.hasSellerQuote) {
      return `Your move: Send quote to ${buyer}`;
    }
    if (
      observe &&
      desks.some((desk) => !desk.held && desk.millQuoted) &&
      !input.hasSellerQuote
    ) {
      return `Desk tools to Send quote to ${buyer}`;
    }
    if (input.hasSellerQuote) return `Waiting on ${buyer} to accept quote`;
  }

  if (input.status === 'confirmed' || input.status === 'part_shipped') {
    const awaitingDispatch = desks.filter((desk) => millNeedsDispatch(desk));
    if (awaitingDispatch.length === 1) {
      return `Waiting on ${awaitingDispatch[0]!.sellerName} to dispatch`;
    }
    if (awaitingDispatch.length > 1) return 'Waiting on mills to dispatch';

    // All released mills finished — parent should already be Settled (pass-through / heal).
    return null;
  }

  if (input.status === 'dispatched') return 'Dispatched · complete';
  if (input.status === 'settled') return 'Settled · complete';
  return null;
}

/** @deprecated use traderActionsBehindTakeOver */
export function traderFulfillmentBehindTakeOver(
  millDesks: OrderView['millDesks'] | undefined,
  _status?: string,
): boolean {
  return traderActionsBehindTakeOver(millDesks);
}

export function millLineForParent(
  desk: OrderMillDeskView,
  parentItemId: string,
): OrderMillDeskView['lines'][number] | null {
  return desk.lines?.find((line) => line.parentItemId === parentItemId) ?? null;
}

/** Prefill Send quote from mill rates when the mill has quoted. */
export function quotePrefillFromMills(
  items: OrderView['items'],
  millDesks: OrderView['millDesks'] | undefined,
): { rates: Record<string, string>; qty: Record<string, string> } {
  const rates: Record<string, string> = {};
  const qty: Record<string, string> = {};
  const millByParent = new Map<string, OrderMillDeskView['lines'][number]>();
  for (const desk of millDesks ?? []) {
    if (!desk.millQuoted || desk.held) continue;
    for (const line of desk.lines ?? []) {
      millByParent.set(line.parentItemId, line);
    }
  }
  for (const item of items) {
    if (item.lineStatus !== 'open') continue;
    const mill = millByParent.get(item.id);
    if (mill && !mill.millDeclined && mill.millRate != null) {
      rates[item.id] = String(mill.millRate);
      qty[item.id] = String(mill.millQuantity ?? item.quantity);
    } else {
      rates[item.id] = item.rate != null ? String(item.rate) : '';
      qty[item.id] = String(item.quantity);
    }
  }
  return { rates, qty };
}

export function millFromToCells(input: {
  millQuoted: boolean;
  millDeclined: boolean;
  millRate: number | null;
  millQuantity: number | null;
  buyerQuoted: boolean;
  buyerRate: number | null;
  buyerQuantity: number;
  unit: string | null;
  formatAmount: (rate: number | null) => string;
  formatUnitSuffix: (unit: string | null) => string;
}): {
  fromAmount: string;
  fromUnit: string;
  fromQtyPrefix: string;
  toAmount: string;
  toUnit: string;
} {
  const { formatAmount, formatUnitSuffix } = input;
  let fromAmount = '—';
  let fromUnit = '';
  let fromQtyPrefix = '';
  if (input.millQuoted) {
    if (input.millDeclined) {
      fromAmount = 'Can’t';
    } else if (input.millRate != null) {
      fromAmount = formatAmount(input.millRate);
      fromUnit = formatUnitSuffix(input.unit);
      if (input.millQuantity != null && input.millQuantity !== input.buyerQuantity) {
        fromQtyPrefix = `${input.millQuantity} × `;
      }
    }
  }
  const toAmount = input.buyerQuoted ? formatAmount(input.buyerRate) : '—';
  const toUnit = input.buyerQuoted ? formatUnitSuffix(input.unit) : '';
  return { fromAmount, fromUnit, fromQtyPrefix, toAmount, toUnit };
}

