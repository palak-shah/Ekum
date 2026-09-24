import type { OrderItemView } from '@ekum/domain-types';

/** Send quote lists open + already Can’t supply (declined) — never drop a row. */
export function quoteSheetItems(items: OrderItemView[]): OrderItemView[] {
  return items.filter((item) => item.lineStatus === 'open' || item.lineStatus === 'declined');
}

/** Soft declined wash — never fades the Can’t supply control. */
export function quoteCantSupplyRowClass(cantSupply: boolean): string {
  return cantSupply ? 'rounded-lg bg-foam/90' : '';
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
