import { useLayoutEffect, useRef } from 'react';
import { howManyNoteHeightPx } from '@/features/orders/howManyNoteHeight';
import { TextArea } from '@/ui/kit';

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

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${howManyNoteHeightPx(el.scrollHeight)}px`;
  }, [value]);

  return (
    <TextArea
      ref={ref}
      rows={1}
      className="mt-2 min-h-10 resize-none overflow-y-auto"
      placeholder="Note — colour, packing…"
      value={value}
      disabled={disabled}
      data-testid="how-many-note"
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
