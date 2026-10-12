import { designSheetMoreIds } from '@/features/browse/designSheetMoreIds';

/**
 * @deprecated Prefer `designSheetMoreIds` — kept for album owner menu tests.
 * Owner design sheet ⋯ without Bookmark (legacy). Edit · Remove · Delete.
 */
export function collectionDesignSheetMoreIds(input: {
  canEdit: boolean;
  canDelete: boolean;
}): Array<'edit' | 'remove' | 'delete'> {
  return designSheetMoreIds({
    canEdit: input.canEdit,
    canRemove: true,
    canDelete: input.canDelete,
  }).filter((id): id is 'edit' | 'remove' | 'delete' => id !== 'bookmark');
}
