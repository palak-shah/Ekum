import { Button, Sheet } from '@/ui/kit';

/**
 * When a selected design is also in other packs: delete everywhere or only here.
 */
export function OwnerPackDeleteSheet({
  open,
  onClose,
  busy,
  onDeleteEverywhere,
  onOnlyThisCollection,
}: {
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  onDeleteEverywhere: () => void;
  onOnlyThisCollection: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Also in other collections"
      footer={
        <div className="flex flex-col gap-2" data-testid="owner-pack-delete-sheet">
          <Button
            fullWidth
            variant="secondary"
            className="text-danger"
            disabled={busy}
            data-testid="owner-pack-delete-everywhere"
            onClick={onDeleteEverywhere}
          >
            Delete from all collections
          </Button>
          <Button
            fullWidth
            disabled={busy}
            data-testid="owner-pack-delete-only-here"
            onClick={onOnlyThisCollection}
          >
            Only this collection
          </Button>
          <Button fullWidth variant="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted">
        Some of these designs are in other collections. Delete them everywhere, or only take them out of
        this collection?
      </p>
    </Sheet>
  );
}
