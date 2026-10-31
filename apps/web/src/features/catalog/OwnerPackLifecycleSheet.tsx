import { Button, Sheet, cx } from '@/ui/kit';
import { CheckIcon } from '@/ui/icons';

/**
 * Delete / Draft pack confirm. Also-delete / also-draft uses the same
 * selected-row check language as Apply-to-all — not a native checkbox.
 */
export function OwnerPackLifecycleSheet({
  open,
  onClose,
  busy,
  title,
  body,
  alsoLabel,
  alsoOn,
  onAlso,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  title: string;
  body: string;
  alsoLabel?: string;
  alsoOn?: boolean;
  onAlso?: (next: boolean) => void;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex flex-col gap-2" data-testid="owner-pack-lifecycle-sheet">
          <Button
            fullWidth
            className="text-danger"
            disabled={busy}
            data-testid="owner-pack-lifecycle-confirm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button fullWidth variant="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted">{body}</p>
      {alsoLabel && onAlso ? (
        <button
          type="button"
          data-testid="owner-pack-lifecycle-also"
          aria-pressed={alsoOn}
          onClick={() => onAlso(!alsoOn)}
          className={cx(
            'mt-3 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-emphasis tracking-tight',
            alsoOn ? 'border-accent bg-accent/5 text-ink' : 'border-line bg-surface text-ink',
          )}
        >
          <span
            className={cx(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px]',
              alsoOn ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface',
            )}
            aria-hidden
          >
            {alsoOn ? <CheckIcon width={14} height={14} strokeWidth={2.5} /> : null}
          </span>
          <span>{alsoLabel}</span>
        </button>
      ) : null}
    </Sheet>
  );
}
