/** Album viewer header: Edit (owner) or Bookmark (visitor); multi-pick via long-press. */
export function collectionViewerPrimaryAction(
  isOwner: boolean,
): 'edit' | 'bookmark' {
  return isOwner ? 'edit' : 'bookmark';
}

/** How many sheet for any visitor pack with designs — not only curated (I-handle) packs. */
export function collectionPackQtySheet(input: {
  visitor: boolean;
  hasProducts: boolean;
}): boolean {
  return input.visitor && input.hasProducts;
}

/** Whole-pack Ask rates / Order — same sticky dock as a design page. */
export function collectionPackTradeDock(input: {
  visitor: boolean;
  live: boolean;
  hasProducts: boolean;
  selecting: boolean;
  resumeContinue: boolean;
}): boolean {
  return (
    input.visitor &&
    input.live &&
    input.hasProducts &&
    !input.selecting &&
    !input.resumeContinue
  );
}

/** Pack Description sits above designs for anyone who can open the album. */
export function collectionShowPackNote(description?: string | null): boolean {
  return Boolean(description?.trim());
}

export function noteBlockOverflows(scrollHeight: number, clientHeight: number): boolean {
  return scrollHeight > clientHeight + 1;
}

/** “Order goes to trader · they send mill lots” — Your paths ticket me only (sr 16). */
export function collectionShowHandleCopy(input: {
  curatedVisitor: boolean;
  viewerTicket?: 'me' | 'mill' | null;
}): boolean {
  if (!input.curatedVisitor) return false;
  return (input.viewerTicket ?? 'me') === 'me';
}
