import { Button, Sheet } from '@/ui/kit';

/**
 * Confirm discarding half-done work before leaving a create/edit flow.
 */
export function DiscardChangesSheet({
  open,
  onCancel,
  onLeave,
}: {
  open: boolean;
  onCancel: () => void;
  onLeave: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onCancel}
      title="Leave the page?"
      footer={
        <div className="flex flex-col gap-2" data-testid="discard-changes-sheet">
          <Button fullWidth variant="secondary" autoFocus={open} onClick={onCancel}>
            Cancel
          </Button>
          <Button fullWidth variant="ghost" className="text-danger" onClick={onLeave}>
            Leave
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted">Changes you have made will be discarded.</p>
    </Sheet>
  );
}
