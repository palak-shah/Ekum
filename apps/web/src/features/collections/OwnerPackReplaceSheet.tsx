import { Button, Sheet } from '@/ui/kit';

/** Confirm clearing membership before picking a new set. */
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
      <p className="text-sm text-muted">
        Clears this pack, then you pick the new set. New photos are saved in Designs
        and publish with a live pack.
      </p>
    </Sheet>
  );
}
