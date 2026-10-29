import {
  catalogRateIsBunchPrice,
  catalogWholePeerIds,
  collapseCatalogWholeLines,
  type OrderItemView,
} from '@ekum/domain-types';
import type { HowManyQtyLine } from '@/features/orders/howManyLineMeta';

/** Buyer / catalog-owner lists: one row per whole catalog. Mill hops stay per design. */
export function ticketDisplayItems(items: OrderItemView[]): OrderItemView[] {
  return collapseCatalogWholeLines(items).map((row) => {
    if (row.kind === 'line') return row.item;
    const lead = row.items[0]!;
    return {
      ...lead,
      name: row.catalogName,
    };
  });
}

export function catalogPeerProductIds(
  items: OrderItemView[],
  productId: string,
): string[] {
  const hit = items.find((item) => item.productId === productId);
  if (!hit) return [productId];
  const ids = catalogWholePeerIds(items, hit.id);
  return items
    .filter((item) => ids.includes(item.id))
    .map((item) => item.productId)
    .filter((id): id is string => Boolean(id));
}

export function catalogPeerOrderItemIds(
  items: OrderItemView[],
  orderItemId: string,
): string[] {
  return catalogWholePeerIds(items, orderItemId);
}

/** One bill line per catalog group so Total qty is 1 set not 9 pcs. */
export function ticketBillItems(items: OrderItemView[]): HowManyQtyLine[] {
  return collapseCatalogWholeLines(items).map((row) => {
    if (row.kind === 'line') return row.item;
    const lead = row.items[0]!;
    const bunch = catalogRateIsBunchPrice(lead.catalogRateUnit);
    const rate =
      bunch || lead.rate == null ? lead.rate : lead.rate * row.items.length;
    return {
      quantity: lead.quantity,
      unit: lead.unit,
      piecesPerPack: bunch ? 1 : lead.piecesPerPack,
      dispatchUnit: lead.dispatchUnit,
      catalogRateUnit: lead.catalogRateUnit,
      rate,
      lineStatus: lead.lineStatus,
    };
  });
}
