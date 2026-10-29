/** Display / API grouping for Order as whole catalogs. Mill hops (`sourceItemId`) stay per design. */

export type CatalogWholeStamp = {
  catalogCollectionId?: string | null;
  catalogName?: string | null;
  catalogWhole?: boolean | null;
  sourceItemId?: string | null;
};

export function isCatalogWholeGroupMember(item: CatalogWholeStamp): boolean {
  return Boolean(item.catalogWhole && item.catalogCollectionId?.trim() && !item.sourceItemId);
}

export type CatalogWholeDisplayRow<T> =
  | { kind: 'catalog'; catalogCollectionId: string; catalogName: string; items: T[] }
  | { kind: 'line'; item: T };

export function collapseCatalogWholeLines<T extends CatalogWholeStamp>(
  items: T[],
): CatalogWholeDisplayRow<T>[] {
  const rows: CatalogWholeDisplayRow<T>[] = [];
  const grouped = new Map<string, T[]>();
  const order: string[] = [];

  for (const item of items) {
    if (!isCatalogWholeGroupMember(item)) continue;
    const id = item.catalogCollectionId!.trim();
    if (!grouped.has(id)) {
      grouped.set(id, []);
      order.push(id);
    }
    grouped.get(id)!.push(item);
  }

  const consumed = new Set<T>();
  for (const id of order) {
    const group = grouped.get(id) ?? [];
    for (const item of group) consumed.add(item);
  }

  const seenGroup = new Set<string>();
  for (const item of items) {
    if (!isCatalogWholeGroupMember(item)) {
      if (!consumed.has(item)) rows.push({ kind: 'line', item });
      continue;
    }
    const id = item.catalogCollectionId!.trim();
    if (seenGroup.has(id)) continue;
    seenGroup.add(id);
    const group = grouped.get(id) ?? [item];
    rows.push({
      kind: 'catalog',
      catalogCollectionId: id,
      catalogName: group[0]?.catalogName?.trim() || 'Catalog',
      items: group,
    });
  }
  return rows;
}

export function catalogWholeDisplayCount<T extends CatalogWholeStamp>(items: T[]): number {
  return collapseCatalogWholeLines(items).length;
}

/** Frozen chat card: 1 catalog, not 9 designs. */
export function catalogWholeChatMeta<T extends CatalogWholeStamp>(items: T[]): {
  itemCount: number;
  catalogCount?: number;
  catalogName?: string;
} {
  const rows = collapseCatalogWholeLines(items);
  const catalogs = rows.filter(
    (row): row is Extract<CatalogWholeDisplayRow<T>, { kind: 'catalog' }> =>
      row.kind === 'catalog',
  );
  return {
    itemCount: rows.length,
    ...(catalogs.length > 0
      ? {
          catalogCount: catalogs.length,
          ...(catalogs.length === 1 ? { catalogName: catalogs[0]!.catalogName } : {}),
        }
      : {}),
  };
}

export function catalogWholePeerIds<T extends CatalogWholeStamp & { id: string }>(
  items: T[],
  orderItemId: string,
): string[] {
  const hit = items.find((item) => item.id === orderItemId);
  if (!hit || !isCatalogWholeGroupMember(hit)) return [orderItemId];
  const id = hit.catalogCollectionId!.trim();
  return items
    .filter((item) => isCatalogWholeGroupMember(item) && item.catalogCollectionId?.trim() === id)
    .map((item) => item.id);
}

export const CATALOG_WHOLE_QTY = 'CATALOG_WHOLE_QTY';
export const CATALOG_WHOLE_SPLIT = 'CATALOG_WHOLE_SPLIT';

export function catalogWholeQtyMessage(name: string) {
  return `${name.trim() || 'This catalog'} is ordered as a whole — same quantity on every design.`;
}

export function catalogWholeSplitMessage(name: string) {
  return `${name.trim() || 'This catalog'} is ordered as a whole — confirm or decline every design together.`;
}

export function assertEqualCatalogWholeQty<T extends CatalogWholeStamp & { quantity: number }>(
  items: T[],
): { code: string; message: string } | null {
  const rows = collapseCatalogWholeLines(items);
  for (const row of rows) {
    if (row.kind !== 'catalog') continue;
    const qty = row.items[0]?.quantity;
    if (row.items.some((item) => item.quantity !== qty)) {
      return {
        code: CATALOG_WHOLE_QTY,
        message: catalogWholeQtyMessage(row.catalogName),
      };
    }
  }
  return null;
}
