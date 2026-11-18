/**
 * Show Load more only when the server still has pages AND the current view
 * has not already painted every known row for that view (Pending / Completed /
 * Needs you totals). Search / unknown totals keep the cursor signal alone.
 */
export function ordersListNeedsLoadMore(input: {
  serverHasMore: boolean;
  loadedVisible: number;
  /** null = counts unknown (Find) or not arrived yet → trust serverHasMore */
  knownTotal: number | null;
}): boolean {
  if (!input.serverHasMore) return false;
  if (input.knownTotal == null) return true;
  return input.loadedVisible < input.knownTotal;
}
