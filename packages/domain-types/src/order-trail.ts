import { catalogRateUnit, isPackOrderUnit, packSizeForUnit } from './order-billing';

/** Append-only order audit trail (Order detail Timeline). */

export const OrderTrailType = {
  Requested: 'requested',
  Updated: 'updated',
  Quoted: 'quoted',
  Confirmed: 'confirmed',
  PartShipped: 'part_shipped',
  Dispatched: 'dispatched',
  DispatchEdited: 'dispatch_edited',
  Settled: 'settled',
  Cancelled: 'cancelled',
  Declined: 'declined',
  Delivered: 'delivered',
  ReturnRaised: 'return_raised',
  ReturnDecided: 'return_decided',
  PaymentAsked: 'payment_asked',
} as const;
export type OrderTrailType = (typeof OrderTrailType)[keyof typeof OrderTrailType];

export type OrderTrailEventView = {
  id: string;
  type: string;
  at: string;
  /** Display who-line already resolved for the viewer (staff or business name). */
  who: string | null;
  summary: string | null;
  detail: string | null;
  note: string | null;
  noteVoiceUrl: string | null;
  noteVoiceDurationMs: number | null;
  noteImageUrls?: string[];
};

export const ORDER_TRAIL_LABELS: Record<string, string> = {
  [OrderTrailType.Requested]: 'Requested',
  [OrderTrailType.Updated]: 'Updated',
  [OrderTrailType.Quoted]: 'Quoted',
  [OrderTrailType.Confirmed]: 'Confirmed',
  [OrderTrailType.PartShipped]: 'Part shipped',
  [OrderTrailType.Dispatched]: 'Dispatched',
  [OrderTrailType.DispatchEdited]: 'Dispatch edited',
  [OrderTrailType.Settled]: 'Settled',
  [OrderTrailType.Cancelled]: 'Cancelled',
  [OrderTrailType.Declined]: 'Declined',
  [OrderTrailType.Delivered]: 'Delivered',
  [OrderTrailType.ReturnRaised]: 'Return raised',
  [OrderTrailType.ReturnDecided]: 'Return decided',
  [OrderTrailType.PaymentAsked]: 'Payment asked',
};

export function orderTrailLabel(type: string): string {
  return ORDER_TRAIL_LABELS[type] ?? type;
}

const ORDER_NOUN: Record<string, { one: string; many: string }> = {
  pc: { one: 'pc', many: 'pcs' },
  set: { one: 'set', many: 'sets' },
  mtr: { one: 'mtr', many: 'mtrs' },
  than: { one: 'than', many: 'thans' },
  dozen: { one: 'dozen', many: 'dozen' },
  kg: { one: 'kg', many: 'kg' },
  box: { one: 'box', many: 'boxes' },
  bundle: { one: 'bundle', many: 'bundles' },
};

function unitCountNoun(unit: string | null | undefined, count: number): string {
  const key = unit?.trim() || 'pc';
  const pair = ORDER_NOUN[key] ?? { one: key, many: `${key}s` };
  return count === 1 ? pair.one : pair.many;
}

export type OrderQtyFamilyLine = {
  quantity: number;
  unit?: string | null;
  piecesPerPack?: number | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
};

/** Unit-family totals for trail / ticket (`60 mtrs`, `2 sets = 24 pcs`). */
export function orderQtyFamilyRows(lines: OrderQtyFamilyLine[]): string[] {
  const withQty = lines.filter((l) => Number.isFinite(l.quantity) && l.quantity > 0);
  if (withQty.length === 0) return [];

  const packGroups = new Map<string, OrderQtyFamilyLine[]>();
  const nativeGroups = new Map<string, OrderQtyFamilyLine[]>();

  for (const line of withQty) {
    if (isPackOrderUnit(line.unit)) {
      const orderUnit = line.unit?.trim() || 'set';
      const pack = packSizeForUnit(line.unit, line.piecesPerPack);
      const contents =
        catalogRateUnit({
          unit: line.unit,
          dispatchUnit: line.dispatchUnit,
          catalogRateUnit: line.catalogRateUnit,
        }) ??
        line.dispatchUnit?.trim() ??
        'pc';
      const key = pack == null ? `${orderUnit}|unknown` : `${orderUnit}|${contents}`;
      const group = packGroups.get(key) ?? [];
      group.push(line);
      packGroups.set(key, group);
    } else {
      const unit = line.unit?.trim() || 'pc';
      const group = nativeGroups.get(unit) ?? [];
      group.push(line);
      nativeGroups.set(unit, group);
    }
  }

  const rows: string[] = [];
  for (const [key, group] of packGroups) {
    const [orderUnit, contents] = key.split('|') as [string, string];
    const total = group.reduce((sum, l) => sum + l.quantity, 0);
    const noun = unitCountNoun(orderUnit, total);
    if (contents === 'unknown') {
      rows.push(`${total} ${noun}`);
      continue;
    }
    const totalPcs = group.reduce(
      (sum, l) => sum + l.quantity * (packSizeForUnit(l.unit, l.piecesPerPack) ?? 0),
      0,
    );
    rows.push(`${total} ${noun} = ${totalPcs} ${unitCountNoun(contents, totalPcs)}`);
  }
  for (const [unit, group] of nativeGroups) {
    const total = group.reduce((sum, l) => sum + l.quantity, 0);
    rows.push(`${total} ${unitCountNoun(unit, total)}`);
  }
  return rows;
}

export function orderQtyFamilyLabel(lines: OrderQtyFamilyLine[]): string | null {
  const rows = orderQtyFamilyRows(lines);
  return rows.length > 0 ? rows.join(' · ') : null;
}

export type AmendTrailLine = {
  productId?: string | null;
  quantity: number;
};

export type AmendTrailChange = {
  qtyChanged: boolean;
  removedCount: number;
  addedCount: number;
};

function lineQtyNumber(quantity: number): number {
  return Number.isFinite(quantity) ? quantity : 0;
}

/** Diff Edit order before/after by product. Remove-only is not also qty-changed. */
export function amendTrailChange(
  before: AmendTrailLine[],
  after: AmendTrailLine[],
): AmendTrailChange {
  const beforeBy = new Map<string, number>();
  const afterBy = new Map<string, number>();
  for (const line of before) {
    const key = line.productId?.trim();
    if (!key) continue;
    beforeBy.set(key, lineQtyNumber(line.quantity));
  }
  for (const line of after) {
    const key = line.productId?.trim();
    if (!key) continue;
    afterBy.set(key, lineQtyNumber(line.quantity));
  }
  let removedCount = 0;
  let addedCount = 0;
  let qtyChanged = false;
  for (const [id, qty] of beforeBy) {
    if (!afterBy.has(id)) {
      removedCount += 1;
      continue;
    }
    if (afterBy.get(id) !== qty) qtyChanged = true;
  }
  for (const id of afterBy.keys()) {
    if (!beforeBy.has(id)) addedCount += 1;
  }
  return { qtyChanged, removedCount, addedCount };
}

/** Timeline line after Edit — what changed, not the ticket Total. */
export function amendTrailSummary(change: AmendTrailChange): string {
  const parts: string[] = [];
  if (change.qtyChanged) parts.push('Updated qty');
  if (change.removedCount === 1) parts.push('Removed 1 design');
  if (change.removedCount > 1) parts.push(`Removed ${change.removedCount} designs`);
  if (change.addedCount === 1) parts.push('Added 1 design');
  if (change.addedCount > 1) parts.push(`Added ${change.addedCount} designs`);
  return parts.length > 0 ? parts.join(' · ') : 'Updated';
}

export function isBareUpdatedTrailSummary(summary: string | null | undefined): boolean {
  if (summary == null || summary.trim() === '') return true;
  const trimmed = summary.trim();
  return trimmed === 'Updated' || trimmed === ORDER_TRAIL_LABELS[OrderTrailType.Updated];
}

/** Previous slice wrote `Updated — 60 mtrs`. Metres already live on Total. */
export function isQtyEchoUpdatedTrailSummary(summary: string | null | undefined): boolean {
  const trimmed = summary?.trim() ?? '';
  return trimmed.startsWith('Updated — ');
}

export function isDesignCountTrailDetail(detail: string | null | undefined): boolean {
  if (detail == null) return false;
  return /^\d+\s+designs?$/i.test(detail.trim());
}

/** Timeline line for Send quote — first vs later send. Null total = no ₹ (unbillable pack). */
export function quoteTrailSummary(
  total: number | null | undefined,
  alreadyQuoted: boolean,
): string {
  if (total == null || !Number.isFinite(total)) {
    return alreadyQuoted ? 'Quote updated' : 'Quoted';
  }
  const amount = `₹${Math.round(total).toLocaleString('en-IN')}`;
  return alreadyQuoted ? `Quote updated — ${amount}` : `Quoted — ${amount}`;
}

/**
 * WhatsApp-style: one live quote in the timeline. Earlier Quoted / Quote updated
 * rows are dropped; the latest keeps its summary. Caller may show a quiet Edited cue.
 */
export function collapseQuotedTrailEvents(
  trail: OrderTrailEventView[],
): { events: OrderTrailEventView[]; quoteEditCount: number } {
  const quotedIndexes: number[] = [];
  trail.forEach((step, index) => {
    if (step.type === OrderTrailType.Quoted || step.type === 'quoted') {
      quotedIndexes.push(index);
    }
  });
  if (quotedIndexes.length <= 1) {
    return { events: trail, quoteEditCount: 0 };
  }
  const drop = new Set(quotedIndexes.slice(0, -1));
  return {
    events: trail.filter((_, index) => !drop.has(index)),
    quoteEditCount: quotedIndexes.length - 1,
  };
}

/**
 * Legacy / unpriced rows with no money line — null, empty, plain "Quoted",
 * or plain "Quote updated" (null-total later send from quoteTrailSummary).
 */
export function isBareQuotedTrailSummary(summary: string | null | undefined): boolean {
  if (summary == null || summary.trim() === '') return true;
  const trimmed = summary.trim();
  return (
    trimmed === 'Quoted' ||
    trimmed === 'Quote updated' ||
    trimmed === ORDER_TRAIL_LABELS[OrderTrailType.Quoted]
  );
}

/** Completed for attention / filters: full dispatch, settle, legacy delivered. */
export function isOrderFulfillmentComplete(status: string): boolean {
  return status === 'dispatched' || status === 'settled' || status === 'delivered';
}

export function isOrderTerminalClosed(status: string): boolean {
  return (
    status === 'dispatched' ||
    status === 'settled' ||
    status === 'delivered' ||
    status === 'declined' ||
    status === 'cancelled'
  );
}
