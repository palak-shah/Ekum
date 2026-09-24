import { cx } from '@/ui/kit';
import type { MentionCandidate } from '@ekum/domain-types';

export function ChatMentionPicker({
  items,
  activeIndex,
  onPick,
}: {
  items: MentionCandidate[];
  activeIndex: number;
  onPick: (row: MentionCandidate) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div
      role="listbox"
      aria-label="Mention"
      id="chat-mention-picker"
      data-testid="chat-mention-picker"
      className="overflow-hidden rounded-[14px] border border-line bg-surface shadow-[var(--shadow-soft)]"
    >
      {items.map((row, index) => (
        <button
          key={`${row.kind}-${row.id}`}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          data-testid={`chat-mention-${row.kind}-${row.id}`}
          className={cx(
            'flex w-full items-baseline justify-between gap-3 px-3.5 py-2.5 text-left',
            index > 0 ? 'border-t border-line/70' : '',
            index === activeIndex ? 'bg-accent/5' : 'hover:bg-foam/70',
          )}
          onMouseDown={(event) => {
            event.preventDefault();
            onPick(row);
          }}
        >
          <span className="min-w-0 truncate text-sm font-semibold tracking-tight text-ink">
            {row.name}
          </span>
          <span className="shrink-0 text-[11px] text-muted">{row.hint}</span>
        </button>
      ))}
    </div>
  );
}
