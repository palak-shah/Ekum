import type { ReactNode } from 'react';
import { Sheet, cx } from '@/ui/kit';

export type MoreActionItem = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Danger / destructive — usually last. */
  danger?: boolean;
  testId?: string;
  /** Highlight when a nested step is open (e.g. Mute). */
  active?: boolean;
};

const ROW =
  'flex w-full items-center gap-3 border-b border-line/70 px-1 py-3.5 text-left last:border-b-0 hover:bg-foam/70 active:bg-foam disabled:opacity-40';

/** One icon + label row inside MoreActionsSheet. */
export function MoreActionRow({
  item,
  onPick,
}: {
  item: MoreActionItem;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      data-testid={item.testId}
      disabled={item.disabled}
      aria-expanded={item.active || undefined}
      className={cx(
        ROW,
        item.danger && 'text-danger',
        item.active && 'bg-accent/5',
        !item.danger && 'text-ink',
      )}
      onClick={onPick}
    >
      <span
        className={cx('shrink-0', item.danger ? 'text-danger' : 'text-muted')}
        aria-hidden
      >
        {item.icon}
      </span>
      <span
        className={cx(
          'text-[15px] font-semibold tracking-tight',
          item.danger ? 'text-danger' : 'text-ink',
        )}
      >
        {item.label}
      </span>
    </button>
  );
}

/**
 * App-wide ⋯ / account action menu — bottom sheet, icon then text.
 * Not for filter chips or attach pickers.
 */
export function MoreActionsSheet({
  open,
  onClose,
  title,
  items,
  testId = 'more-actions-sheet',
  onBack,
  backTestId,
  note,
  noteTestId,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  items: MoreActionItem[];
  testId?: string;
  /** Nested step (e.g. mute duration). */
  onBack?: () => void;
  backTestId?: string;
  /** Quiet why-line under the rows (look-only / Curate lock). */
  note?: string | null;
  noteTestId?: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title} onBack={onBack} backTestId={backTestId}>
      <div className="flex flex-col pb-2" role="menu" data-testid={testId}>
        {items.map((item) => (
          <MoreActionRow
            key={item.id}
            item={item}
            onPick={() => {
              item.onClick();
            }}
          />
        ))}
        {note ? (
          <p
            className="border-t border-line px-1 py-3 text-xs font-medium leading-snug text-muted"
            data-testid={noteTestId}
          >
            {note}
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}
