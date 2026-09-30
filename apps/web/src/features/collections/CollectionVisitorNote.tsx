import { useLayoutEffect, useRef, useState } from 'react';
import { noteBlockOverflows } from '@/features/collections/collectionViewerChrome';
import { cx } from '@/ui/kit';

const NOTE_CLAMP = 'line-clamp-4 whitespace-pre-wrap text-sm leading-snug text-ink';

export function CollectionVisitorNote({ text }: { text: string }) {
  const note = text.trim();
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflow, setOverflow] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    setOverflow(noteBlockOverflows(el.scrollHeight, el.clientHeight));
  }, [note, open]);

  if (!note) return null;

  return (
    <div className="px-0.5" data-testid="collection-visitor-note">
      <p ref={ref} className={cx(NOTE_CLAMP, open && 'line-clamp-none')}>
        {note}
      </p>
      {overflow ? (
        <button
          type="button"
          className="mt-1 text-[12px] font-bold tracking-tight text-accent"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? 'View less' : 'View more'}
        </button>
      ) : null}
    </div>
  );
}
