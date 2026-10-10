import { MoreActionsSheet } from '@/ui/MoreActionsSheet';
import {
  CameraIcon,
  DesignIcon,
  LockIcon,
  PaperPlaneIcon,
  PencilIcon,
  RepostIcon,
} from '@/ui/icons';

/**
 * Owner album ⋯ — Share · Who · Add from existing designs · Add photos ·
 * Replace entire collection · Edit (everyday first; manage trio always listed).
 */
export function OwnerCollectionMoreSheet({
  open,
  title,
  onClose,
  onShare,
  onWhoHasAccess,
  onAddDesigns,
  onAddPhotos,
  onReplace,
  onEditDetails,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onShare: () => void;
  onWhoHasAccess: () => void;
  onAddDesigns: () => void;
  onAddPhotos: () => void;
  onReplace: () => void;
  onEditDetails: () => void;
}) {
  return (
    <MoreActionsSheet
      open={open}
      onClose={onClose}
      title={title}
      testId="owner-collection-more-sheet"
      items={[
        {
          id: 'share',
          label: 'Share this collection',
          icon: <PaperPlaneIcon width={20} height={20} />,
          onClick: () => {
            onClose();
            onShare();
          },
          testId: 'collection-menu-share',
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
          label: 'Replace entire collection',
          icon: <RepostIcon width={20} height={20} />,
          onClick: () => {
            onClose();
            onReplace();
          },
          testId: 'collection-menu-replace',
        },
        {
          id: 'edit',
          label: 'Edit collection details',
          icon: <PencilIcon width={20} height={20} />,
          onClick: () => {
            onClose();
            onEditDetails();
          },
          testId: 'collection-menu-edit',
        },
      ]}
    />
  );
}
