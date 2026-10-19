/** You library published select: Share · Order. Lifecycle is per collection, not this dock. */
export function youLibraryPublishedSelectChrome(input: {
  hideableCount: number;
}): { dock: Array<'share' | 'order'> } {
  if (input.hideableCount < 1) return { dock: [] };
  return { dock: ['share', 'order'] };
}
