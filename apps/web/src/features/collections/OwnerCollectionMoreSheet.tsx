import { MoreActionsSheet } from '@/ui/MoreActionsSheet';
import {
  BookmarkIcon,
  CameraIcon,
  DesignIcon,
  LockIcon,
  PaperPlaneIcon,
  PencilIcon,
  RepostIcon,
} from '@/ui/icons';
import {
  bookmarkThisPackLabel,
  editPackDetailsLabel,
  replaceEntirePackLabel,
  shareThisPackLabel,
} from '@/features/catalog/packKindCopy';

/**
 * Owner album idle ⋯ — Share · Bookmark · Who · Add designs · Add photos ·
 * Replace · Edit · Draft pack (everyday first; manage trio always listed).
 */
export function OwnerCollectionMoreSheet({
  open,
  title,
  onClose,
  onShare,
  onBookmark,
  bookmarkSaved = false,
  bookmarkBusy = false,
  onWhoHasAccess,
  onAddDesigns,
  onAddPhotos,
  onReplace,
  onEditDetails,
  onDraft,
  draftLabel = 'Draft this collection',
  canDraft = false,
  isGeneral = false,
  kind,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onShare: () => void;
  onBookmark: () => void;
  bookmarkSaved?: boolean;
  bookmarkBusy?: boolean;
  onWhoHasAccess: () => void;
  onAddDesigns: () => void;
  onAddPhotos: () => void;
  onReplace: () => void;
  onEditDetails: () => void;
  onDraft?: () => void;
  draftLabel?: string;
  canDraft?: boolean;
  isGeneral?: boolean;
  kind?: string | null;
}) {
  return (
    <MoreActionsSheet
      open={open}
      onClose={onClose}
      title={title}
      testId="owner-collection-more-sheet"
      items={[
        ...(isGeneral
          ? [
              {
                id: 'bookmark',
                label: bookmarkSaved ? 'Remove bookmark' : bookmarkThisPackLabel(kind),
                icon: <BookmarkIcon width={20} height={20} />,
                disabled: bookmarkBusy,
                onClick: () => {
                  onClose();
                  onBookmark();
                },
                testId: 'collection-menu-bookmark',
              },
            ]
          : [
        {
          id: 'share',
          label: shareThisPackLabel(kind),
          icon: <PaperPlaneIcon width={20} height={20} />,
          onClick: () => {
            onClose();
            onShare();
          },
          testId: 'collection-menu-share',
        },
        {
          id: 'bookmark',
          label: bookmarkSaved ? 'Remove bookmark' : bookmarkThisPackLabel(kind),
          icon: <BookmarkIcon width={20} height={20} />,
          disabled: bookmarkBusy,
          onClick: () => {
            onClose();
            onBookmark();
          },
          testId: 'collection-menu-bookmark',
        },
        {
          id: 'who',
          label: 'Who has access',
          icon: <LockIcon width={20} height={20} />,
          onClick: () => {
            onClose();
            onWhoHasAccess();
          },
          testId: 'collection-menu-who',
        },
        {
          id: 'add-designs',
          label: 'Add from existing designs',
          icon: <DesignIcon width={20} height={20} />,
          onClick: () => {
            onClose();
            onAddDesigns();
          },
          testId: 'collection-menu-add-designs',
        },
        {
          id: 'photos',
          label: 'Add photos',
          icon: <CameraIcon width={20} height={20} />,
          onClick: () => {
            onClose();
            onAddPhotos();
          },
          testId: 'collection-menu-add-photos',
        },
        {
          id: 'replace',
          label: replaceEntirePackLabel(kind),
          icon: <RepostIcon width={20} height={20} />,
          onClick: () => {
            onClose();
            onReplace();
          },
          testId: 'collection-menu-replace',
        },
          ]),
        {
          id: 'edit',
          label: editPackDetailsLabel(kind),
          icon: <PencilIcon width={20} height={20} />,
          onClick: () => {
            onClose();
            onEditDetails();
          },
          testId: 'collection-menu-edit',
        },
        ...(canDraft && onDraft && !isGeneral
          ? [
              {
                id: 'draft',
                label: draftLabel,
                icon: <LockIcon width={20} height={20} />,
                onClick: () => {
                  onClose();
                  onDraft();
                },
                testId: 'collection-menu-draft',
              },
            ]
          : []),
      ]}
    />
  );
}
