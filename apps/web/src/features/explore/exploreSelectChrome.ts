export function exploreShowSelectChrome(input: {
  searchFocused: boolean;
  tradeSide: 'buying' | 'selling';
  contentMode: 'all' | 'collections' | 'designs' | 'businesses';
  selectableCount: number;
}): boolean {
  if (input.searchFocused) return false;
  if (input.tradeSide === 'selling') return false;
  if (input.contentMode === 'businesses') return false;
  return input.selectableCount > 0;
}
