import { MoreActionsSheet } from '@/ui/MoreActionsSheet';
import { CameraIcon, LockIcon, PaperPlaneIcon, PencilIcon } from '@/ui/icons';

/**
 * Owner album ⋯ — bottom sheet, icon then label (client prototype / app-wide more).
 */
export function OwnerCollectionMoreSheet({
  open,
  title,
  onClose,
  onShare,
  onWhoHasAccess,
  onAddPhotos,
  onEditDetails,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onShare: () => void;
  onWhoHasAccess: () => void;
  onAddPhotos: () => void;
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
