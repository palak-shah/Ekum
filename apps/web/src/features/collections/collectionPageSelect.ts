/** Album select is local — a traveling pile from the shop must not lock this page. */
export function collectionPageIsSelecting(input: {
  enterSelect: boolean;
  pageSelecting: boolean;
}): boolean {
  return input.enterSelect || input.pageSelecting;
}
