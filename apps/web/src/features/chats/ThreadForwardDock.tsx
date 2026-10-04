import { Button } from '@/ui/kit';

/** Inline forward dock in the thread column — above the safe area (no bottom nav on thread). */
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
      className="shrink-0 border-t border-line bg-canvas/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md"
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
