import { Button, Sheet } from '@/ui/kit';

/**
 * Edit-design leave confirm — Save keeps work (Update is easy to miss);
 * Discard leaves without saving. Chat / orders keep DiscardChangesSheet.
 */
export function SaveOrDiscardSheet({
  open,
  onCancel,
  onDiscard,
  onSave,
  saving = false,
}: {
  open: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
  saving?: boolean;
}) {
  return (
    <Sheet
      open={open}
      onClose={onCancel}
      title="Save changes?"
      footer={
        <div className="flex flex-col gap-2" data-testid="save-or-discard-sheet">
          <Button fullWidth autoFocus={open} disabled={saving} onClick={onSave}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            fullWidth
            variant="ghost"
            className="text-danger"
            disabled={saving}
            onClick={onDiscard}
          >
            Discard
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted">Update is at the bottom. Save keeps what you typed.</p>
    </Sheet>
  );
}
