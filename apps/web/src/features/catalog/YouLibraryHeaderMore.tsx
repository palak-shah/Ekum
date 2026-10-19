import { useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  isYouSavedSearch,
  youLibraryTabFromSearch,
  youLibraryWriteSearch,
} from '@/features/saved/youSavedHref';
import {
  getYouLibrarySelectMenu,
  subscribeYouLibrarySelectMenu,
} from '@/features/catalog/youLibrarySelectMenu';
import { BookmarkIcon, CheckIcon, LockIcon, MoreHorizontalIcon, ReturnIcon } from '@/ui/icons';
import { MoreActionsSheet, type MoreActionItem } from '@/ui/MoreActionsSheet';

/** Page ⋯ on My collections. Idle: Drafts · Archived · Bookmarks. Selecting: Draft / Publish · Archive. */
export function YouLibraryHeaderMore() {
  const [open, setOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const selectMenu = useSyncExternalStore(
    subscribeYouLibrarySelectMenu,
    getYouLibrarySelectMenu,
    getYouLibrarySelectMenu,
  );
  const saved = isYouSavedSearch(params);
  const archived = params.get('view') === 'archived' && !saved;
  const drafts = params.get('view') === 'draft' && !saved;
  const tab = youLibraryTabFromSearch(params);
  const select = params.get('select') === '1';

  const write = (next: {
    saved: boolean;
    archived: boolean;
    drafts: boolean;
    tab: 'products' | 'collections';
  }) => {
    const query = youLibraryWriteSearch({
      tab: next.tab,
      saved: next.saved,
      select,
      archived: next.archived,
      drafts: next.drafts,
    });
    setParams(query, { replace: true });
  };

  const selectingCollections = Boolean(selectMenu?.selecting);
  const selectItems: MoreActionItem[] = [];
  if (selectingCollections && selectMenu) {
    if (selectMenu.canDraft) {
      selectItems.push({
        id: 'draft',
        label: 'Draft',
        icon: <LockIcon width={20} height={20} />,
        testId: 'you-library-select-draft',
        onClick: () => {
          setOpen(false);
          selectMenu.onDraft();
        },
      });
    }
    if (selectMenu.canPublish) {
      selectItems.push({
        id: 'publish',
        label: 'Publish',
        icon: <CheckIcon width={20} height={20} />,
        testId: 'you-library-select-publish',
        onClick: () => {
          setOpen(false);
          selectMenu.onPublish();
        },
      });
    }
    if (selectMenu.canArchive) {
      selectItems.push({
        id: 'archive',
        label: 'Archive',
        icon: <ReturnIcon width={20} height={20} />,
        testId: 'you-library-select-archive',
        onClick: () => {
          setOpen(false);
          selectMenu.onArchive();
        },
      });
    }
  }

  const idleItems: MoreActionItem[] = [
    {
      id: 'drafts',
      label: 'Drafts',
      icon: <LockIcon width={20} height={20} />,
      active: drafts,
      testId: 'you-library-page-drafts',
      onClick: () => {
        setOpen(false);
        write({
          tab: 'collections',
          saved: false,
          archived: false,
          drafts: !drafts,
        });
      },
    },
    {
      id: 'archived',
      label: 'Archived collections',
      icon: <ReturnIcon width={20} height={20} />,
      active: archived,
      testId: 'you-library-page-archived',
      onClick: () => {
        setOpen(false);
        write({
          tab: 'collections',
          saved: false,
          archived: !archived,
          drafts: false,
        });
      },
    },
    {
      id: 'bookmarks',
      label: 'Bookmarks',
      icon: <BookmarkIcon width={20} height={20} />,
      active: saved,
      testId: 'you-library-page-bookmarks',
      onClick: () => {
        setOpen(false);
        write({
          tab,
          saved: !saved,
          archived: false,
          drafts: false,
        });
      },
    },
  ];

  const items = selectingCollections && selectItems.length > 0 ? selectItems : idleItems;

  return (
    <>
      <button
        type="button"
        data-testid="you-library-page-more"
        aria-label="More"
        aria-expanded={open}
        className="rounded-full p-2 text-ink hover:bg-foam"
        onClick={() => setOpen(true)}
      >
        <MoreHorizontalIcon />
      </button>
      <MoreActionsSheet
        open={open}
        onClose={() => setOpen(false)}
        title="My collections"
        testId="you-library-page-menu"
        items={items}
      />
    </>
  );
}
