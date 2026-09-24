/** Album viewer header: Edit (owner) or Bookmark (visitor); multi-pick via long-press. */
export function collectionViewerPrimaryAction(
  isOwner: boolean,
): 'edit' | 'bookmark' {
  return isOwner ? 'edit' : 'bookmark';
}

/** Whole-pack Ask rates / Order — same sticky dock as a design page. */
export function collectionPackTradeDock(input: {
  curatedVisitor: boolean;
  selecting: boolean;
  resumeContinue: boolean;
}): boolean {
  return input.curatedVisitor && !input.selecting && !input.resumeContinue;
}

/** “Order goes to trader · they send mill lots” — Your paths ticket me only (sr 16). */
export function collectionShowHandleCopy(input: {
  curatedVisitor: boolean;
  viewerTicket?: 'me' | 'mill' | null;
}): boolean {
  if (!input.curatedVisitor) return false;
  return (input.viewerTicket ?? 'me') === 'me';
}
