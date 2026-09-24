import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export const HELP_BTN_CLASS =
  'flex h-6 w-6 items-center justify-center rounded-full bg-foam text-xs font-semibold text-muted';

export function QuietHelpPop({
  open,
  onClose,
  testId,
  anchor,
  children,
}: {
  open: boolean;
  onClose: () => void;
  testId: string;
  anchor: HTMLElement | null;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !anchor || typeof document === 'undefined') return null;
  const rect = anchor.getBoundingClientRect();
  const width = 272;
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 z-[60] cursor-default bg-ink/15"
        onClick={onClose}
      />
      <div
        role="dialog"
        data-testid={testId}
        className="fixed z-[61] max-w-[17rem] rounded-[14px] border border-line bg-surface px-3 py-2.5 text-sm leading-snug text-ink shadow-[var(--shadow-soft)]"
        style={{ top: rect.bottom + 8, left, width }}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
