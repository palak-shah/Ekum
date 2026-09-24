import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { youShortcutItems } from '@/features/settings/youShortcuts';
import { useAuth } from '@/lib/auth';
import { cx } from '@/ui/kit';
import { MoreHorizontalIcon } from '@/ui/icons';

const ITEM =
  'flex w-full px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70';

/** You shell ⋯ — Network, Settings, Log out (same band as Chats ⋯). */
export function YouHeaderMore() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 8 });
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  const onLogout = () => {
    void logout().then(() => navigate('/login', { replace: true }));
  };

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        data-testid="you-more"
        aria-label="More"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((next) => !next)}
        className={cx(
          'rounded-full p-2 transition-colors',
          open ? 'bg-foam text-ink' : 'text-slate hover:bg-foam hover:text-ink',
        )}
      >
        <MoreHorizontalIcon width={22} height={22} />
      </button>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-[60] cursor-default bg-ink/15"
                onClick={() => setOpen(false)}
              />
              <div
                ref={panelRef}
                role="menu"
                data-testid="you-more-menu"
                className="fixed z-[61] min-w-[11rem] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[var(--shadow-soft)]"
                style={{ top: pos.top, right: pos.right }}
              >
                {youShortcutItems().map((item, index) => (
                  <button
                    key={item.to}
                    type="button"
                    role="menuitem"
                    data-testid={`you-more-${item.label.toLowerCase()}`}
                    className={cx(ITEM, index > 0 && 'border-t border-line/70')}
                    onClick={() => {
                      setOpen(false);
                      navigate(item.to);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  role="menuitem"
                  data-testid="you-more-logout"
                  className={cx(ITEM, 'border-t border-line/70')}
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                >
                  Log out
                </button>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
