/** Owner design sheet ⋯ rows (Edit when editable; Remove always last). */
export function collectionDesignSheetMoreIds(canEdit: boolean): Array<'edit' | 'remove'> {
  return canEdit ? ['edit', 'remove'] : ['remove'];
}
