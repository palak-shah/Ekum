import { Button, Sheet } from '@/ui/kit';

/**
 * Confirm a destructive thread action (Leave / Remove group).
 * Same chrome as DiscardChangesSheet: Cancel first, danger action second.
 */
export function ConfirmActionSheet({
  open,
  title,
  body,
  confirmLabel,
  testId,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  testId: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <div className="flex flex-col gap-2" data-testid={testId}>
          <Button fullWidth variant="secondary" autoFocus={open} disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            fullWidth
            variant="ghost"
            className="text-danger"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted">{body}</p>
    </Sheet>
  );
}
