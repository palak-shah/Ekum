/** Owner design sheet ⋯ rows — Edit (own) · Remove · Delete design (own; last). */
export function collectionDesignSheetMoreIds(input: {
  canEdit: boolean;
  canDelete: boolean;
}): Array<'edit' | 'remove' | 'delete'> {
  const ids: Array<'edit' | 'remove' | 'delete'> = [];
  if (input.canEdit) ids.push('edit');
  ids.push('remove');
  if (input.canDelete) ids.push('delete');
  return ids;
}
