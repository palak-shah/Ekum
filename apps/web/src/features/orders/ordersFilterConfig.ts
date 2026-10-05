import type { TradeKindFacet } from './tradeFind';

export type OrdersAttentionTab = 'pending' | 'completed';

/** Pending chip — open trade. */
export const TRADE_FILTER_PENDING_STATUSES: ReadonlyArray<{ label: string; status: string }> = [
  { label: 'Requested', status: 'requested' },
  { label: 'Confirmed', status: 'confirmed' },
  { label: 'Part shipped', status: 'part_shipped' },
];

/** Completed chip — finished trade. */
export const TRADE_FILTER_COMPLETED_STATUSES: ReadonlyArray<{ label: string; status: string }> = [
  { label: 'Dispatched', status: 'dispatched' },
  { label: 'Settled', status: 'settled' },
  { label: 'Cancelled', status: 'cancelled' },
];

/** Statuses in the Orders filter menu (single-select, scoped by tab). */
export const TRADE_FILTER_STATUSES: ReadonlyArray<{ label: string; status: string }> = [
  ...TRADE_FILTER_PENDING_STATUSES,
  ...TRADE_FILTER_COMPLETED_STATUSES,
];

/** Legacy status still filterable via URL / Find, not in the menu list above. */
export const TRADE_FILTER_LEGACY_STATUSES: ReadonlyArray<{ label: string; status: string }> = [
  { label: 'Delivered', status: 'delivered' },
];

export const TRADE_FILTER_TYPES: ReadonlyArray<{ label: string; kind: TradeKindFacet }> = [
  { label: 'Order', kind: 'order' },
  { label: 'Sample', kind: 'sample' },
  { label: 'Complaint', kind: 'complaint' },
];

export function tradeStatusesForTab(
  tab: OrdersAttentionTab,
): ReadonlyArray<{ label: string; status: string }> {
  return tab === 'pending' ? TRADE_FILTER_PENDING_STATUSES : TRADE_FILTER_COMPLETED_STATUSES;
}

export function tabForTradeStatus(status: string): OrdersAttentionTab | null {
  if (TRADE_FILTER_PENDING_STATUSES.some((row) => row.status === status)) return 'pending';
  if (TRADE_FILTER_COMPLETED_STATUSES.some((row) => row.status === status)) return 'completed';
  if (TRADE_FILTER_LEGACY_STATUSES.some((row) => row.status === status)) return 'completed';
  return null;
}

export function statusFitsTab(status: string | null, tab: OrdersAttentionTab): boolean {
  if (!status) return true;
  return tabForTradeStatus(status) === tab;
}

export function statusFromParam(value: string | null): string | null {
  if (!value) return null;
  if (TRADE_FILTER_STATUSES.some((row) => row.status === value)) return value;
  if (TRADE_FILTER_LEGACY_STATUSES.some((row) => row.status === value)) return value;
  return null;
}

export function tradeMenuFilterSummary(input: {
  statusFacet: string | null;
  kindFacet: TradeKindFacet | null;
  dateFacet: { label: string } | null;
}): string {
  const parts: string[] = [];
  if (input.kindFacet === 'sample') parts.push('Sample');
  else if (input.kindFacet === 'complaint') parts.push('Complaint');
  else if (input.kindFacet === 'trading') parts.push('Trading');
  else if (input.kindFacet === 'order') parts.push('Order');
  if (input.statusFacet) {
    parts.push(tradeStatusLabel(input.statusFacet));
  }
  if (input.dateFacet?.label) parts.push(input.dateFacet.label);
  return parts.join(' · ');
}

export function tradeStatusLabel(status: string | null): string {
  if (!status) return 'Any status';
  return (
    TRADE_FILTER_STATUSES.find((row) => row.status === status)?.label ??
    TRADE_FILTER_LEGACY_STATUSES.find((row) => row.status === status)?.label ??
    status
  );
}

export function tradeKindLabel(kind: TradeKindFacet | null): string {
  if (!kind) return 'All types';
  return TRADE_FILTER_TYPES.find((row) => row.kind === kind)?.label ?? kind;
}
