import { CollectionStatus, type CollectionView } from '@ekum/domain-types';

export type YouCollectionRowAction = 'hide' | 'unhide' | 'archive' | 'order';

function isDraft(status: string): boolean {
  return status === CollectionStatus.Draft || status === CollectionStatus.Ready;
}

/** Per-collection More. Not the page menu (Archived / Bookmarks). No Repost. */
export function youCollectionRowMore(collection: Pick<CollectionView, 'status'>): YouCollectionRowAction[] {
  const actions: YouCollectionRowAction[] = [];
  if (collection.status === CollectionStatus.Published) actions.push('hide');
  if (isDraft(collection.status)) actions.push('unhide');
  if (collection.status !== CollectionStatus.Archived) actions.push('archive');
  actions.push('order');
  return actions;
}
