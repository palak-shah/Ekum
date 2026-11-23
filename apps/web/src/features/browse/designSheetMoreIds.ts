/**
 * DesignSheet ⋯ rows — Bookmark always; Download when allowDownload/owner;
 * then Edit · Your rate · Publish · Add to pack · Remove · Delete.
 * Remove only when the sheet has collection context.
 */
export function designSheetMoreIds(input: {
  canEdit: boolean;
  canRemove: boolean;
  canDelete: boolean;
  canAddToPack?: boolean;
  canPublish?: boolean;
  /** Owner repost pack — per-design buyer rate override. */
  canSetBuyerRate?: boolean;
  /** Allow download on (or owner) — export original. */
  canDownload?: boolean;
}): Array<
  | 'bookmark'
  | 'download'
  | 'edit'
  | 'buyerRate'
  | 'publish'
  | 'addToPack'
  | 'remove'
  | 'delete'
> {
  const ids: Array<
    | 'bookmark'
    | 'download'
    | 'edit'
    | 'buyerRate'
    | 'publish'
    | 'addToPack'
    | 'remove'
    | 'delete'
  > = ['bookmark'];
  if (input.canDownload) ids.push('download');
  if (input.canEdit) ids.push('edit');
  if (input.canSetBuyerRate) ids.push('buyerRate');
  if (input.canPublish) ids.push('publish');
  if (input.canAddToPack) ids.push('addToPack');
  if (input.canRemove) ids.push('remove');
  if (input.canDelete) ids.push('delete');
  return ids;
}
