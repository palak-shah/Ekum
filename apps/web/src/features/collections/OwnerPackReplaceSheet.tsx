import { Button, Sheet } from '@/ui/kit';

/** Confirm Replace — membership updates only after a non-empty new set is saved. */
export function OwnerPackReplaceSheet({
  open,
  onClose,
  busy,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Replace whole collection?"
      footer={
        <div className="flex flex-col gap-2" data-testid="owner-pack-replace-sheet">
          <Button fullWidth disabled={busy} data-testid="owner-pack-replace-confirm" onClick={onConfirm}>
            Replace
          </Button>
          <Button fullWidth variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted" data-testid="owner-pack-replace-copy">
        Pick the new set next. The collection updates only after you save at least one design.
        Cancel or pick nothing keeps it unchanged. New photos are saved in Designs and publish
        with a live collection.
      </p>
    </Sheet>
  );
}
