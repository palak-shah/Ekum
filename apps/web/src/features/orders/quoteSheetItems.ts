import type { OrderItemView } from '@ekum/domain-types';

/** Send quote lists open + already Can’t supply (declined) — never drop a row. */
export function quoteSheetItems(items: OrderItemView[]): OrderItemView[] {
  return items.filter((item) => item.lineStatus === 'open' || item.lineStatus === 'declined');
}

/** Soft declined wash on Dispatch-style quote cards — never fades Can’t supply. */
export function quoteCantSupplyRowClass(cantSupply: boolean): string {
  return cantSupply ? 'bg-foam/90' : '';
}

/** Mute the design (thumb, name, qty/rate), not the toggle. */
export function quoteCantSupplyMutedClass(cantSupply: boolean): string {
  return cantSupply ? 'opacity-50' : '';
}

/** Full-contrast control so untick is obvious. */
export function quoteCantSupplyControlClass(cantSupply: boolean): string {
  return cantSupply
    ? 'mt-1 flex items-center gap-1.5 text-xs font-semibold text-ink'
    : 'mt-0.5 flex items-center gap-1 text-[11px] text-muted';
}

export function orderLineCantSupplyCue(cantSupply: boolean): string | null {
  return cantSupply ? 'Can’t supply' : null;
}

export function orderLineLeftoverCue(item: Pick<OrderItemView, 'unavailableReason'>): string | null {
  const reason = item.unavailableReason?.trim();
  return reason || null;
}

/**
 * Quiet reference under the name on Send quote — buyer ask always;
 * last sent quote only when this ticket already has a seller quote.
 * Offer fields stay the live Qty | Rate (no second fact strip).
 */
/**
 * Quiet reference under the name: buyer ask, then either the line’s set price
 * (catalog / prior) or last Quoted offer — so Confirm can skip Send quote and
 * still see what was on the ticket.
 */
export function quoteSheetReferenceCue(input: {
  asked: number;
  hasSellerQuote: boolean;
  quotedQty: number;
  quotedRate: number | null;
  formatAmount: (rate: number) => string;
}): string {
  const bits = [`Asked ${input.asked}`];
  if (!input.hasSellerQuote) {
    if (input.quotedRate != null) bits.push(input.formatAmount(input.quotedRate));
    return bits.join(' · ');
  }
  const qty = Number.isFinite(input.quotedQty) && input.quotedQty > 0 ? input.quotedQty : input.asked;
  if (input.quotedRate != null) {
    bits.push(`Quoted ${qty} · ${input.formatAmount(input.quotedRate)}`);
  } else {
    bits.push(`Quoted ${qty}`);
  }
  return bits.join(' · ');
}

/**
 * Reopen: declined default on; an explicit untick (`prev[id] === false`) wins
 * so the seller can bring the line back.
 */
export function quoteUnavailableOnOpen(
  items: OrderItemView[],
  prev: Record<string, boolean>,
): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const item of quoteSheetItems(items)) {
    if (prev[item.id] === false) {
      next[item.id] = false;
      continue;
    }
    next[item.id] = item.lineStatus === 'declined' || Boolean(prev[item.id]);
  }
  return next;
}
