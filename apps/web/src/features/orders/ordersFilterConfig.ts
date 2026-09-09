import type { TradeKindFacet } from './tradeFind';

/** Statuses in the Orders filter menu (single-select). */
export const TRADE_FILTER_STATUSES: ReadonlyArray<{ label: string; status: string }> = [
  { label: 'Requested', status: 'requested' },
  { label: 'Confirmed', status: 'confirmed' },
  { label: 'Part shipped', status: 'part_shipped' },
  { label: 'Dispatched · complete', status: 'dispatched' },
  { label: 'Settled · complete', status: 'settled' },
  // Legacy `delivered` still matches Find/API; not offered as a primary filter.
  { label: 'Received', status: 'received' },
  { label: 'Approved', status: 'approved' },
  { label: 'Resolved', status: 'resolved' },
  { label: 'Declined', status: 'declined' },
  { label: 'Cancelled', status: 'cancelled' },
];

/** Legacy status still filterable via URL / Find, not in the menu list above. */
export const TRADE_FILTER_LEGACY_STATUSES: ReadonlyArray<{ label: string; status: string }> = [
  { label: 'Delivered', status: 'delivered' },
];

export const TRADE_FILTER_TYPES: ReadonlyArray<{ label: string; kind: TradeKindFacet }> = [
  { label: 'Order', kind: 'order' },
  { label: 'Trading', kind: 'trading' },
  { label: 'Sample', kind: 'sample' },
  { label: 'Return', kind: 'return' },
];

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
  else if (input.kindFacet === 'return') parts.push('Return');
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
