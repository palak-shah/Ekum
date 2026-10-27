/**
 * DesignSheet ⋯ rows — Bookmark always; then Edit · Publish · Add to pack · Remove · Delete (own).
 * Remove only when the sheet has collection context.
 */
export function designSheetMoreIds(input: {
  canEdit: boolean;
  canRemove: boolean;
  canDelete: boolean;
  canAddToPack?: boolean;
  canPublish?: boolean;
}): Array<'bookmark' | 'edit' | 'publish' | 'addToPack' | 'remove' | 'delete'> {
  const ids: Array<'bookmark' | 'edit' | 'publish' | 'addToPack' | 'remove' | 'delete'> = [
    'bookmark',
  ];
  if (input.canEdit) ids.push('edit');
  if (input.canPublish) ids.push('publish');
  if (input.canAddToPack) ids.push('addToPack');
  if (input.canRemove) ids.push('remove');
  if (input.canDelete) ids.push('delete');
  return ids;
}
