/** Thumb on Your selection opens the design or album — not a viewer. */
export function selectionRowHref(
  kind: 'Design' | 'Collection',
  id: string,
): string {
  return kind === 'Collection' ? `/collections/${id}` : `/explore/products/${id}`;
}
