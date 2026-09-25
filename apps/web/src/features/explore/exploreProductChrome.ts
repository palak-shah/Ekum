/** Sticky Curate · Ask for rates · Order — visitors only, same as pack `visitor`. */
export function exploreProductTradeDock(input: {
  visitor: boolean;
  visible: boolean;
}): boolean {
  return input.visitor && input.visible;
}
