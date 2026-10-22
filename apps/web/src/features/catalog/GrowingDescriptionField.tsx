import { useEffect, useRef } from 'react';
import { TextArea } from '@/ui/kit';
import { collectionDescriptionHeightPx } from './collectionDescriptionHeight';

/** Collection Description: one kit row, grows while typing, then caps. */
export function GrowingDescriptionField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${collectionDescriptionHeightPx(el.scrollHeight)}px`;
  }, [value]);

  return (
    <TextArea
      ref={ref}
      aria-label="Description"
      data-testid="collection-description"
      className="min-h-10 resize-none overflow-hidden py-2"
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
