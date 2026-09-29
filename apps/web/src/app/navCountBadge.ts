/** Tab / bell pill — hide at 0; always the exact count. */
export function tabCountBadge(count: number | undefined): number | undefined {
  if (!count || count <= 0) return undefined;
  return count;
}

export function tabCountLabel(count: number): string {
  return String(count);
}

export function ordersNavAriaLabel(count: number): string {
  if (count <= 0) return 'Orders';
  return `Orders, ${tabCountLabel(count)} need you`;
}
