import { useLayoutEffect, useRef, useState } from 'react';
import { howManyNoteHeightPx } from '@/features/orders/howManyNoteHeight';

/**
 * Optional caption. A boxed field on every row looks required and steals
 * the qty job — show a quiet Add note until they tap or already typed.
 */
export function HowManyLineNote({
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(() => Boolean(value.trim()));

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${howManyNoteHeightPx(el.scrollHeight)}px`;
  }, [value, open]);

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        data-testid="how-many-add-note"
        className="mt-1.5 text-left text-[12px] font-medium text-muted disabled:opacity-45"
        onClick={() => setOpen(true)}
      >
        Add note
      </button>
    );
  }

  return (
    <textarea
      ref={ref}
      rows={1}
      autoFocus={!value.trim()}
      className="mt-1.5 min-h-8 w-full resize-none overflow-y-auto rounded-lg bg-foam/70 px-2.5 py-1.5 text-[13px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-muted focus:bg-foam disabled:opacity-45"
      placeholder="Colour, packing…"
      value={value}
      disabled={disabled}
      data-testid="how-many-note"
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => {
        if (!value.trim()) setOpen(false);
      }}
    />
  );
}
