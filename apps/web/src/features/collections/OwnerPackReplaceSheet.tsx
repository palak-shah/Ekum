import { AddDesignsControl } from '@/features/catalog/AddDesignsControl';
import { Button, Sheet } from '@/ui/kit';

/**
 * Replace — ask Designs or Photos in the sheet, then open that picker.
 * Membership updates only after a non-empty new set is saved.
 */
export function OwnerPackReplaceSheet({
  open,
  onClose,
  busy,
  uploading,
  onDesigns,
  onPhotos,
}: {
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  uploading?: boolean;
  onDesigns: () => void;
  onPhotos: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Replace whole collection?"
      footer={
        <Button
          fullWidth
          variant="secondary"
          disabled={busy}
          data-testid="owner-pack-replace-cancel"
          onClick={onClose}
        >
          Cancel
        </Button>
      }
    >
      <div className="flex flex-col gap-3" data-testid="owner-pack-replace-sheet">
        <p className="text-sm text-muted" data-testid="owner-pack-replace-copy">
          Choose photos or designs for the new set. The collection updates only after you save.
          Cancel or pick nothing keeps it unchanged. New photos are saved in Designs and publish
          with a live collection.
        </p>
        <AddDesignsControl
          size="hero"
          uploading={uploading}
          disabled={busy || uploading}
          onDesigns={onDesigns}
          onPhotos={onPhotos}
        />
      </div>
    </Sheet>
  );
}
