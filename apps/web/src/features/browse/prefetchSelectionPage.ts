/** Warm the Selection route chunk once the user has something selected. */
export function prefetchSelectionPage(): void {
  void import('@/features/browse/SelectionPage');
}
