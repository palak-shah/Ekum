import { CollectionStatus, type CollectionView } from '@ekum/domain-types';
import { isGeneralCollection, treatReadyAsDraft } from './youLibraryKind';

export type YouCollectionRowAction = 'hide' | 'unhide' | 'archive' | 'order';

/** Per-collection More. Not the page menu (Deleted / Bookmarks). No Repost. No Restore. */
export function youCollectionRowMore(
  collection: Pick<CollectionView, 'status'> & { kind?: string },
): YouCollectionRowAction[] {
  if (isGeneralCollection(collection.kind)) return [];
  const actions: YouCollectionRowAction[] = [];
  if (collection.status === CollectionStatus.Published) actions.push('hide');
  if (treatReadyAsDraft(collection.status)) actions.push('unhide');
  if (collection.status !== CollectionStatus.Archived) actions.push('archive');
  actions.push('order');
  return actions;
}
