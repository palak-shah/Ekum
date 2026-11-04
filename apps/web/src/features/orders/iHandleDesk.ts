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

/** Parent item ids claimed by mill hops — union of each desk `itemIds`. */
export function millOwnedParentItemIds(
  millDesks: OrderView['millDesks'] | undefined,
): Set<string> {
  const ids = new Set<string>();
  for (const desk of millDesks ?? []) {
    for (const id of desk.itemIds ?? []) ids.add(id);
  }
  return ids;
}

/**
 * Parent lines not on any mill desk. Empty mill desks → all items
 * (Direct / 1:1 / I-handle without hops).
 */
export function leftoverYouItems<T extends { id: string }>(
  items: T[],
  millDesks: OrderView['millDesks'] | undefined,
): T[] {
  if (!millDesks?.length) return items;
  const millIds = millOwnedParentItemIds(millDesks);
  return items.filter((item) => !millIds.has(item.id));
}

export function leftoverYouHasRemaining(
  items: Array<{ id: string; remainingQuantity: number }>,
  millDesks: OrderView['millDesks'] | undefined,
): boolean {
  return leftoverYouItems(items, millDesks).some((item) => item.remainingQuantity > 0);
}

export function leftoverYouHasDeclined(
  items: Array<{ id: string; lineStatus: string }>,
  millDesks: OrderView['millDesks'] | undefined,
): boolean {
  return leftoverYouItems(items, millDesks).some((item) => item.lineStatus === 'declined');
}

/**
 * Parent item list vs mill cards — never both.
 * Trader and Reveal-On buyer already see designs under each mill card.
 * Leftover trader-owned lines render as a separate You group.
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

/** List/Home: Send mill lots only — never Confirm / Send quote on the parent. */
export function traderIHandleNeedsYou(order: OrderView): boolean {
  if (!isIHandleSellingParent(order)) return false;
  return order.status === 'requested' && millLotStillHeld(order);
}

export function traderIHandleNeedsYouLabel(order: OrderView): string | null {
  if (!traderIHandleNeedsYou(order)) return null;
  return 'Needs you Accept & forward';
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
      // orderDetailNextCue callers without youFulfilment stay mill-only.
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

/**
 * Send quote on the desk face — bilateral / mill seller only.
 * I-handle parent with mill desks: no negotiation on the Orders page.
 */
export function showSendQuoteOnDeskFace(
  millDesks?: OrderView['millDesks'],
  _laneTicket?: string | null,
): boolean {
  return !(millDesks && millDesks.length > 0);
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
      /**
       * True after a seller Rate quote — buyer may Accept; Confirm stays the
       * primary lock CTA (Send quote stays secondary).
       */
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
      /** Buyer placed this ticket — Cancel while requested or confirmed. */
      cancel: boolean;
      /**
       * Seller logged this ticket. Decline on requested and on confirmed:
       * the log is already agreed, and Decline is how the buyer refuses it.
       * There is no Accept.
       */
      declineLogged: boolean;
      edit: boolean;
      acceptQuote: boolean;
      raiseReturn: boolean;
    };

/**
 * Teal primary on the requested dock — Confirm, else Send all.
 * Send quote stays middle / secondary only (never the primary CTA).
 */
export function requestedDockPrimary(
  dock: Extract<OrderActionDock, { kind: 'requested' }>,
): 'confirm' | 'sendOrder' | null {
  if (dock.confirm) return 'confirm';
  if (dock.sendOrder) return 'sendOrder';
  return null;
}

/** Sticky dock — seller and buyer, same row above the nav. */
export function orderActionDock(input: {
  isSeller: boolean;
  status: string;
  millDesks?: OrderView['millDesks'];
  sendQuote: boolean;
  openForDispatch: boolean;
  hasRemaining: boolean;
  /** Declined lines still restorable — keep Dispatch even when nothing left to ship. */
  hasDeclinedToRestore?: boolean;
  canSettle: boolean;
  partiallyShipped?: boolean;
  hasSellerQuote?: boolean;
  canAmend?: boolean;
  canAcceptQuote?: boolean;
  /** Seller logged this ticket — hide Confirm; buyer Declines (no Accept). */
  createdBySeller?: boolean;
  /**
   * Trader on mill hop (buyer of mill ticket): qty Edit until confirm;
   * Cancel in ⋯; never Accept-quote rate-haggle.
   */
  isTraderMillHop?: boolean;
}): OrderActionDock {
  if (!input.isSeller) {
    const requested = input.status === 'requested';
    const millHop = input.isTraderMillHop === true;
    const acceptQuote =
      !millHop && requested && input.canAcceptQuote === true;
    const edit = input.canAmend === true;
    const openToRefuse = requested || input.status === 'confirmed';
    // Seller-logged (own catalog): confirmed on create. Decline stays on the
    // confirmed ticket so the buyer can refuse a phone-agreed log. Buyer-placed
    // tickets keep Cancel for the same statuses. Mill hop: Cancel in ⋯ only.
    const declineLogged =
      !millHop && input.createdBySeller === true && openToRefuse;
    const cancel =
      !millHop && input.createdBySeller !== true && openToRefuse;
    if (!cancel && !declineLogged && !edit && !acceptQuote) {
      return { kind: 'none' };
    }
    return {
      kind: 'buy',
      cancel,
      declineLogged,
      edit,
      acceptQuote,
      raiseReturn: false,
    };
  }
  if (input.status === 'requested') {
    const sendOrder = showMillSendAll(input.millDesks);
    const confirm =
      showSellerConfirmOnDesk(input.millDesks) && input.createdBySeller !== true;
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
  // Parent Dispatch stays off while mill desks exist — You lots ship on the
  // linked You Selling hop; mill lots on mill hops. Legacy Slice B leftover
  // without a You hop still passes hasRemaining from the caller.
  const millDeskBlocksParentDispatch = Boolean(input.millDesks?.length);
  const openDispatchSheet =
    input.openForDispatch &&
    !millDeskBlocksParentDispatch &&
    (input.hasRemaining || input.hasDeclinedToRestore === true);
  if (openDispatchSheet) {
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

/** You-hop wait after mills are quiet — Confirm / Dispatch on the hop, never parent operate. */
export function youFulfilmentDeskCue(
  youFulfilment: { id: string; status: string } | null | undefined,
): string | null {
  if (!youFulfilment) return null;
  if (youFulfilment.status === 'requested') return 'Your move: Confirm your lots';
  if (youFulfilment.status === 'confirmed' || youFulfilment.status === 'part_shipped') {
    return 'Waiting on You to dispatch';
  }
  return null;
}

/**
 * I-handle trader desk “Your move” — mill Send / wait on mill Confirm,
 * then You hop Confirm / Dispatch when mills are quiet.
 * No parent Send quote / Confirm (trader is buyer on mill hops).
 */
export function traderDeskNextAction(input: {
  status: string;
  counterpartName: string;
  hasSellerQuote?: boolean;
  millDesks: OrderView['millDesks'] | undefined;
  youFulfilment?: { id: string; status: string } | null;
  laneTicket?: string | null;
}): string | null {
  const desks = input.millDesks;
  if (!desks?.length) return null;

  if (input.status === 'requested') {
    const unsent = desks.filter((desk) => desk.held);
    if (unsent.length > 0) {
      if (unsent.length === 1) return `Your move: Send to ${unsent[0]!.sellerName}`;
      return 'Your move: Send mill lots';
    }

    // Released mills — wait for Confirm (no wait-for-rates; mill edits rate on Confirm).
    const awaitingConfirm = desks.filter(
      (desk) => !desk.held && !millDeskDropped(desk) && desk.status === 'requested',
    );
    if (awaitingConfirm.length === 1) {
      return `Waiting on ${awaitingConfirm[0]!.sellerName} to confirm`;
    }
    if (awaitingConfirm.length > 1) return 'Waiting on mills to confirm';

    return youFulfilmentDeskCue(input.youFulfilment);
  }

  if (input.status === 'confirmed' || input.status === 'part_shipped') {
    const awaitingDispatch = desks.filter((desk) => millNeedsDispatch(desk));
    if (awaitingDispatch.length === 1) {
      return `Waiting on ${awaitingDispatch[0]!.sellerName} to dispatch`;
    }
    if (awaitingDispatch.length > 1) return 'Waiting on mills to dispatch';

    return youFulfilmentDeskCue(input.youFulfilment);
  }

  if (input.status === 'dispatched') return 'Dispatched · complete';
  if (input.status === 'settled') return 'Settled · complete';
  return null;
}

/** Compact trade-summary rows for I-handle Selling Manage parent (seller). */
export type TradeSummaryRow = {
  label: string;
  value: string;
  pill?: string;
};

/** Goods path on Manage desk — straight broker path (no godown copy). */
export function tradeSummaryGoodsGo(buyerName: string): string {
  return `Supplier → ${buyerName}`;
}

export function buildTradeSummaryRows(input: {
  buyerName: string;
  millDesks: OrderView['millDesks'] | undefined;
  /** Seller sees mill names; buyer soft-hide omits You buy from. */
  includeMillNames: boolean;
}): TradeSummaryRow[] {
  const rows: TradeSummaryRow[] = [
    { label: 'You sell to', value: input.buyerName, pill: 'Through you' },
  ];
  if (input.includeMillNames) {
    const names = (input.millDesks ?? [])
      .filter((desk) => !millDeskDropped(desk) && desk.sellerName?.trim())
      .map((desk) => desk.sellerName.trim());
    const unique = [...new Set(names)];
    if (unique.length > 0) {
      rows.push({ label: 'You buy from', value: unique.join(', ') });
    }
  }
  rows.push({
    label: 'Goods go',
    value: tradeSummaryGoodsGo(input.buyerName),
  });
  return rows;
}

/** Show You fulfilment card when leftover lines exist or a You hop is linked. */
export function showYouFulfilmentCard(input: {
  millDesks: OrderView['millDesks'] | undefined;
  leftoverCount: number;
  youFulfilmentOrderId?: string | null;
}): boolean {
  if (!(input.millDesks && input.millDesks.length > 0)) return false;
  return input.leftoverCount > 0 || Boolean(input.youFulfilmentOrderId);
}

/**
 * Trader Manage parent with mill desks — trade summary replaces the party card
 * (do not paint the trader as supplier).
 */
export function hideManagePartyCard(
  direction: string | undefined,
  millDesks: OrderView['millDesks'] | undefined,
): boolean {
  return isTraderDeskOperator(direction ?? '', millDesks);
}

/** Released mill open subline — Buying # · wait cue (one place; not StatusPill). */
export function millFulfilmentOpenSubtitle(
  hopOrderId: string,
  waitCue?: string | null,
): string {
  const idTail = hopOrderId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  const hash = `#${idTail || hopOrderId.slice(-4)}`;
  const base = `Buying ${hash}`;
  const tail = waitCue?.trim();
  return tail ? `${base} · ${tail}` : base;
}

/**
 * Wait cue for mill open-row subline — never wait-for-rates.
 * Held → Held; requested → waiting to confirm; else dispatch.
 */
export function millFulfilmentWaitLabel(
  desk: Pick<OrderMillDeskView, 'held' | 'status' | 'passHeld'>,
): string | null {
  if (desk.held || millDeskDropped(desk)) return null;
  if (desk.passHeld) return 'Held';
  if (desk.status === 'requested') return 'waiting to confirm';
  if (millNeedsDispatch(desk)) return 'waiting to dispatch';
  return null;
}

/** Mill hop idle dock wait — trader as buyer of mill ticket (Confirm verb). */
export function millHopAcceptWaitLabel(sellerName: string): string {
  const name = sellerName.trim() || 'supplier';
  return `Waiting for ${name} to confirm`;
}

/**
 * Buy ≈ / Sell caption on Manage mill card design lines.
 * Unequal → both; equal → single ₹; one-sided → that side.
 */
export function millCardLineRateCaption(input: {
  buyRate: number | null | undefined;
  sellRate: number | null | undefined;
  unitSuffix: string;
  formatAmount: (rate: number) => string;
}): string | null {
  const buy = input.buyRate;
  const sell = input.sellRate;
  const u = input.unitSuffix;
  const fmt = input.formatAmount;
  if (buy != null && sell != null && buy !== sell) {
    return `Buy ≈ ${fmt(buy)} · Sell ${fmt(sell)}${u}`;
  }
  if (buy != null && sell != null) {
    return `${fmt(sell)}${u}`;
  }
  if (buy != null) return `Buy ≈ ${fmt(buy)}${u}`;
  if (sell != null) return `${fmt(sell)}${u}`;
  return null;
}

/** `{shipped} of {qty} to {buyer}` on Manage mill card lines. */
export function millCardLineProgressCaption(input: {
  shipped: number;
  quantity: number;
  buyerName: string;
}): string {
  const buyer = input.buyerName.trim() || 'buyer';
  const shipped = Number.isFinite(input.shipped) ? Math.max(0, input.shipped) : 0;
  const qty = Number.isFinite(input.quantity) ? input.quantity : 0;
  return `${shipped} of ${qty} to ${buyer}`;
}

export type DeskChatTarget = {
  id: string;
  name: string;
  role: 'buyer' | 'mill';
  threadId: string;
};

/**
 * Manage desk dock chat targets: buyer thread + released mill threads.
 * Skip You hop (same parties as buyer↔trader).
 */
export function deskChatTargets(input: {
  buyerName: string;
  buyerThreadId?: string | null;
  millDesks: OrderView['millDesks'] | undefined;
}): DeskChatTarget[] {
  const targets: DeskChatTarget[] = [];
  if (input.buyerThreadId) {
    targets.push({
      id: 'buyer',
      name: input.buyerName,
      role: 'buyer',
      threadId: input.buyerThreadId,
    });
  }
  for (const desk of input.millDesks ?? []) {
    if (desk.held || millDeskDropped(desk) || !desk.millThreadId) continue;
    targets.push({
      id: desk.upstreamOrderId,
      name: desk.sellerName,
      role: 'mill',
      threadId: desk.millThreadId,
    });
  }
  return targets;
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

