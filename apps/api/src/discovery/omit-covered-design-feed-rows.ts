/** Hide a solo Explore design when a live pack on the same feed already shows it. */
export function omitCoveredDesignFeedRows<
  T extends { kind: string; product?: { id: string } | null },
>(rows: T[], coveredProductIds: Set<string>): T[] {
  if (coveredProductIds.size === 0) return rows;
  return rows.filter(
    (row) => row.kind !== 'product' || !row.product || !coveredProductIds.has(row.product.id),
  );
}
