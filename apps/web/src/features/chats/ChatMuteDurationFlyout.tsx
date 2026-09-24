import { useEffect, useRef, useState } from 'react';
import type { MuteFor } from '@ekum/domain-types';
import { cx } from '@/ui/kit';
import { placeFlyoutBeside } from './placeFlyoutBeside';

export const MUTE_FOR_OPTIONS: { id: MuteFor; label: string }[] = [
  { id: '8h', label: '8 hours' },
  { id: '1w', label: '1 week' },
  { id: 'always', label: 'Always' },
];

const ITEM =
  'flex w-full px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70 disabled:opacity-40';

export function ChatMuteDurationFlyout({
  host,
  pending,
  onPick,
}: {
  host: { top: number; left: number; right: number; bottom: number } | null;
  pending?: boolean;
  onPick: (muteFor: MuteFor) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 80, left: 16 });

  useEffect(() => {
    if (!host) return;
    const place = () => {
      const box = panelRef.current?.getBoundingClientRect();
      setPos(
        placeFlyoutBeside(
          host,
          { width: window.innerWidth, height: window.innerHeight },
          box ? { width: box.width, height: box.height } : undefined,
        ),
      );
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [host]);

  if (!host) return null;

  return (
    <div
      ref={panelRef}
      role="menu"
      aria-label="Mute for"
      data-testid="chat-mute-flyout"
      className="fixed z-[62] min-w-[8.5rem] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[var(--shadow-soft)]"
      style={{ top: pos.top, left: pos.left }}
    >
      {MUTE_FOR_OPTIONS.map((row, index) => (
        <button
          key={row.id}
          type="button"
          role="menuitem"
          disabled={pending}
          data-testid={`chat-mute-${row.id}`}
          className={cx(ITEM, index > 0 ? 'border-t border-line/70' : '')}
          onClick={() => onPick(row.id)}
        >
          {row.label}
        </button>
      ))}
    </div>
  );
}
