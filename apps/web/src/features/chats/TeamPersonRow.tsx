import { cx } from '@/lib/cx';

const rowClass =
  'flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left';

export function TeamPersonRow({
  name,
  selected,
  trailing,
  onClick,
  disabled,
  takeOffLabel,
  onTakeOff,
}: {
  name: string;
  selected?: boolean;
  trailing?: string;
  onClick?: () => void;
  disabled?: boolean;
  takeOffLabel?: string;
  onTakeOff?: () => void;
}) {
  const body = (
    <>
      <span className="text-sm font-semibold text-ink">{name}</span>
      <span className="flex shrink-0 items-center gap-3">
        {trailing ? <span className="text-xs font-semibold text-muted">{trailing}</span> : null}
        {onTakeOff && takeOffLabel ? (
          <button
            type="button"
            className="text-sm font-semibold text-muted"
            aria-label={takeOffLabel}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onTakeOff();
            }}
          >
            ×
          </button>
        ) : null}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cx(rowClass, selected ? 'border-accent bg-accent/5' : 'border-line bg-surface')}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={cx(rowClass, selected ? 'border-accent bg-accent/5' : 'border-line bg-surface')}>
      {body}
    </div>
  );
}
