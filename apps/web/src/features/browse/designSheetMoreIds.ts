/**
 * DesignSheet ⋯ rows — Bookmark always; then Edit · Remove · Delete (own).
 * Remove only when the sheet has collection context.
 */
export function designSheetMoreIds(input: {
  canEdit: boolean;
  canRemove: boolean;
  canDelete: boolean;
}): Array<'bookmark' | 'edit' | 'remove' | 'delete'> {
  const ids: Array<'bookmark' | 'edit' | 'remove' | 'delete'> = ['bookmark'];
  if (input.canEdit) ids.push('edit');
  if (input.canRemove) ids.push('remove');
  if (input.canDelete) ids.push('delete');
  return ids;
}
