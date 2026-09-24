import { nextOrderAction, type OrderMillDeskView, type OrderView } from '@ekum/domain-types';

export function traderDeskOrderId(order: Pick<OrderView, 'deskOrderId' | 'id'>): string {
  return order.deskOrderId ?? order.id;
}

export function isTraderMillHop(
  order: Pick<OrderView, 'downstreamOrderId' | 'direction' | 'tradeMode'>,
): boolean {
  return Boolean(order.downstreamOrderId) && order.direction === 'buying';
}

/** True mill/trader seller — not a Direct sharer (serializer marks non-buyers as selling). */
export function actorSellsThisOrder(
  sellerCompanyId: string | null | undefined,
  companyId: string | null | undefined,
): boolean {
  return Boolean(companyId && sellerCompanyId && companyId === sellerCompanyId);
}

export function itemsForMill(
  items: OrderView['items'],
  group: OrderMillDeskView,
): OrderView['items'] {
  const ids = new Set(group.itemIds);
  return items.filter((item) => ids.has(item.id));
}

/**
 * Parent item list vs mill cards — never both.
 * Trader and Reveal-On buyer already see designs under each mill card.
 */
export function showOrderParentItemsList(
  millDesks: OrderView['millDesks'] | undefined,
): boolean {
  return !(millDesks && millDesks.length > 0);
}

/** Closed picker label — who the buyer talks to (You vs mill). */
export const BUYER_TALKS_TO = 'Buyer talks to';
export const BUYER_TALKS_TO_YOU = 'You';
/** Mill card / Your paths — group chat, not “show this mill on the desk”. */
export const SHARE_A_GROUP = 'Share a group';
/** Live flip + reveal also stamp the lane — not this ticket only. */
export const PATH_ON_ORDER_SCOPE =
  'This order, and your next ones with these shops.';
export const PATH_REVEAL_ON_ORDER_SCOPE =
  'This mill on this order, and your next ones with this mill and buyer.';
/** Your paths PATCH — open tickets stay. */
export const PATH_ON_PATHS_SCOPE = 'Next orders only. Open tickets stay as they are.';

/** Me vs one shop name, or These mills when two+ (names listed quietly under the option). */
export function orderTicketMillLabel(
  desks: Array<{ sellerName: string }> | undefined,
  fallback: string,
): string {
  if (!desks?.length) return fallback;
  if (desks.length === 1) return desks[0]!.sellerName;
  return 'These mills';
}

/** Quiet under-lines for the mill flip option (2+ shops). Empty when one or none. */
export function orderTicketMillNames(
  desks: Array<{ sellerName: string }> | undefined,
): string[] {
  if (!desks || desks.length < 2) return [];
  return desks.map((desk) => desk.sellerName).filter(Boolean);
}

/**
 * Reveal switch: short label. Null when mill and buyer are the same shop.
 */
export function millRevealLabel(
  mill: Pick<OrderMillDeskView, 'sellerCompanyId' | 'sellerName'>,
  buyer: { companyId: string; name: string },
): string | null {
  if (!mill.sellerCompanyId || !buyer.companyId) return null;
  if (mill.sellerCompanyId === buyer.companyId) return null;
  const millName = mill.sellerName.trim();
  const buyerName = buyer.name.trim();
  if (!millName || !buyerName) return null;
  return SHARE_A_GROUP;
}

export function millDeskDropped(desk: Pick<OrderMillDeskView, 'status'>): boolean {
  return desk.status === 'declined';
}

/** Same wash as a Can’t supply line — whole mill card after Decline. */
export function millDeskCardClass(dropped: boolean): string {
  return dropped ? 'bg-foam/90 opacity-50' : '';
}

export function millCue(group: OrderMillDeskView): string | null {
  if (millDeskDropped(group)) return 'Declined';
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
 * Secondary desk verbs stay on the face (few buttons). Mill Send / Decline stay on the card.
 */
export function traderActionsBehindTakeOver(
  _millDesks: OrderView['millDesks'] | undefined,
): boolean {
  return false;
}

/**
 * Trader Desk cue / mill Send — only when **selling** the Manage parent
 * that has mill desks. Reveal ON may attach millDesks for the **buyer** (identity);
 * that must not flip them into trader ops (BM-09).
 */
export function isTraderDeskOperator(
  direction: string | null | undefined,
  millDesks: OrderView['millDesks'] | undefined,
): boolean {
  return direction === 'selling' && Boolean(millDesks?.length);
}

/** Selling an I-handle parent — list uses `linkedMills`, detail uses `millDesks`. */
export function isIHandleSellingParent(
  order: Pick<OrderView, 'direction' | 'tradeMode' | 'millDesks' | 'linkedMills'>,
): boolean {
  return (
    order.direction === 'selling' &&
    Boolean(
      order.tradeMode === 'manage' ||
        (order.millDesks && order.millDesks.length > 0) ||
        (order.linkedMills && order.linkedMills.length > 0),
    )
  );
}

export function millLotStillHeld(
  order: Pick<OrderView, 'millDesks' | 'linkedMills'>,
): boolean {
  if (order.millDesks?.some((desk) => desk.held)) return true;
  return Boolean(
    order.linkedMills?.some((mill) => mill.held === true || mill.orderId == null),
  );
}

export function unsentMillNames(
  order: Pick<OrderView, 'millDesks' | 'linkedMills'>,
): string[] {
  if (order.millDesks?.some((desk) => desk.held)) {
    return order.millDesks.filter((desk) => desk.held).map((desk) => desk.sellerName);
  }
  return (order.linkedMills ?? [])
    .filter((mill) => mill.held === true || mill.orderId == null)
    .map((mill) => mill.name)
    .filter(Boolean);
}

/** List/Home: Send mill lots or pass mill rates — never Confirm. */
export function traderIHandleNeedsYou(order: OrderView): boolean {
  if (!isIHandleSellingParent(order)) return false;
  if (order.status === 'requested' && millLotStillHeld(order)) return true;
  return Boolean(order.needsQuotePass);
}

export function traderIHandleNeedsYouLabel(order: OrderView): string | null {
  if (!traderIHandleNeedsYou(order)) return null;
  const unsent = unsentMillNames(order);
  if (unsent.length === 1) return `Needs you · Send to ${unsent[0]}`;
  if (unsent.length === 2) return `Needs you · Send to ${unsent[0]} + ${unsent[1]}`;
  if (unsent.length > 2) return `Needs you · Send to ${unsent.length} mills`;
  return 'Needs you · Send quote';
}

/** Retired fold — always false. Seller desk CTAs stay on the face. */
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

/** More actions retired — always false. Buyers never had it (BM-09). */
export function orderDetailTakeOverHasWork(_input: {
  direction: string;
  millDesks: OrderView['millDesks'] | undefined;
  laneTicket?: string | null;
  status: string;
  openForDispatch: boolean;
  hasRemaining: boolean;
  canSettle?: boolean;
}): boolean {
  return false;
}

/** Lane ticket Mills — buyer may see mill identity; trader Send stays on the card. */
export function millsObserveMode(
  laneTicket: string | null | undefined,
  millDesks: OrderView['millDesks'] | undefined,
): boolean {
  return laneTicket === 'mill' && Boolean(millDesks?.length);
}

/** Send quote on the desk face (I-handle and bilateral). */
export function showSendQuoteOnDeskFace(
  _millDesks?: OrderView['millDesks'],
  _laneTicket?: string | null,
): boolean {
  return true;
}

export function heldMillDesks(
  desks: OrderView['millDesks'] | undefined,
): NonNullable<OrderView['millDesks']> {
  return (desks ?? []).filter((desk) => desk.held);
}

/** Send all on the desk dock when two or more shops are still waiting. */
export function showMillSendAll(desks: OrderView['millDesks'] | undefined): boolean {
  return heldMillDesks(desks).length >= 2;
}

export type OrderActionDock =
  | { kind: 'none' }
  | {
      kind: 'requested';
      sendOrder: boolean;
      sendQuote: boolean;
      confirm: boolean;
      /** After a quote, Confirm is teal and Send quote sits in the middle. */
      quoted: boolean;
    }
  | {
      kind: 'fulfill';
      dispatch: boolean;
      dispatchMore: boolean;
      settle: boolean;
    }
  | {
      kind: 'buy';
      cancel: boolean;
      edit: boolean;
      acceptQuote: boolean;
      acceptLogged: boolean;
      raiseReturn: boolean;
    };

/** Sticky dock — seller and buyer, same row above the nav. */
export function orderActionDock(input: {
  isSeller: boolean;
  status: string;
  millDesks?: OrderView['millDesks'];
  sendQuote: boolean;
  openForDispatch: boolean;
  hasRemaining: boolean;
  canSettle: boolean;
  partiallyShipped?: boolean;
  hasSellerQuote?: boolean;
  canAmend?: boolean;
  canAcceptQuote?: boolean;
  canAcceptLogged?: boolean;
}): OrderActionDock {
  if (!input.isSeller) {
    const requested = input.status === 'requested';
    const acceptLogged = requested && input.canAcceptLogged === true;
    const acceptQuote = requested && input.canAcceptQuote === true;
    const edit = input.canAmend === true;
    const cancel =
      !acceptLogged && (requested || input.status === 'confirmed');
    const raiseReturn =
      input.status === 'dispatched' ||
      input.status === 'settled' ||
      input.status === 'delivered';
    if (!cancel && !edit && !acceptQuote && !acceptLogged && !raiseReturn) {
      return { kind: 'none' };
    }
    return {
      kind: 'buy',
      cancel,
      edit,
      acceptQuote,
      acceptLogged,
      raiseReturn,
    };
  }
  if (input.status === 'requested') {
    const sendOrder = showMillSendAll(input.millDesks);
    const confirm = showSellerConfirmOnDesk(input.millDesks);
    const quoted = input.hasSellerQuote === true;
    if (!sendOrder && !input.sendQuote && !confirm) return { kind: 'none' };
    return {
      kind: 'requested',
      sendOrder,
      sendQuote: input.sendQuote,
      confirm,
      quoted,
    };
  }
  if (input.openForDispatch && input.hasRemaining) {
    return {
      kind: 'fulfill',
      dispatch: true,
      dispatchMore: input.partiallyShipped === true,
      settle: input.canSettle === true,
    };
  }
  if (input.canSettle) {
    return { kind: 'fulfill', dispatch: false, dispatchMore: false, settle: true };
  }
  return { kind: 'none' };
}

/** Mill-card Send: always on the card while held (Me or Mills ticket). */
export function showMillSendOnCard(
  _laneTicket?: string | null,
  _millDesks?: OrderView['millDesks'] | undefined,
  _takeOverOpen?: boolean,
): boolean {
  return true;
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

  if (input.status === 'requested') {
    const unsent = desks.filter((desk) => desk.held);
    if (unsent.length > 0) {
      if (unsent.length === 1) return `Your move: Send to ${unsent[0]!.sellerName}`;
      return 'Your move: Send mill lots';
    }

    const awaitingRates = desks.filter((desk) => !desk.held && !desk.millQuoted);
    if (awaitingRates.length === 1) {
      return `Waiting on ${awaitingRates[0]!.sellerName} for rates`;
    }
    if (awaitingRates.length > 1) return 'Waiting on mills for rates';

    if (desks.some((desk) => !desk.held && desk.millQuoted) && !input.hasSellerQuote) {
      return `Your move: Send quote to ${buyer}`;
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
    if (item.lineStatus !== 'open' && item.lineStatus !== 'declined') continue;
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

