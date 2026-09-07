/** Album viewer header: Edit (owner) or Bookmark (visitor); multi-pick via long-press. */
export function collectionViewerPrimaryAction(
  isOwner: boolean,
): 'edit' | 'bookmark' {
  return isOwner ? 'edit' : 'bookmark';
}
