import { Button } from '@/ui/kit';

/** Inline forward dock in the thread column — sits above bottom nav like the composer. */
export function ThreadForwardDock({
  open,
  count,
  pending,
  onCancel,
  onForward,
}: {
  open: boolean;
  count: number;
  pending?: boolean;
  onCancel: () => void;
  onForward: () => void;
}) {
  if (!open || count < 1) return null;

  return (
    <div
      data-testid="thread-forward-dock"
      className="shrink-0 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-md mb-[calc(4.25rem+env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 text-sm font-semibold text-ink">{count} selected</p>
        <button
          type="button"
          className="shrink-0 text-sm font-semibold text-muted"
          onClick={onCancel}
        >
          Cancel
        </button>
        <Button
          data-testid="thread-forward-submit"
          className="shrink-0 min-w-[6.5rem]"
          disabled={pending}
          onClick={onForward}
        >
          {pending ? 'Forwarding…' : 'Forward'}
        </Button>
      </div>
    </div>
  );
}
