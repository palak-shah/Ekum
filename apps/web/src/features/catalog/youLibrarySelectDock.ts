/** You library published select: Share · Order on the dock; lifecycle in ⋯ (no Message). */
export function youLibraryPublishedSelectChrome(input: {
  hideableCount: number;
  archivableCount: number;
  canCurate: boolean;
}): { dock: Array<'share' | 'order'>; more: Array<'hide' | 'archive' | 'repost'> } {
  if (input.hideableCount < 1) {
    return { dock: [], more: [] };
  }
  const more: Array<'hide' | 'archive' | 'repost'> = ['hide'];
  if (input.archivableCount > 0) more.push('archive');
  if (input.canCurate) more.push('repost');
  return { dock: ['share', 'order'], more };
}
