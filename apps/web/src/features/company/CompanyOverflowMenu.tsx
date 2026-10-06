import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MuteFor } from '@ekum/domain-types';
import { ChatMuteDurationFlyout } from '@/features/chats/ChatMuteDurationFlyout';
import { cx } from '@/ui/kit';
import type { ShopOverflowItem } from './shopOverflowMenu';

const ITEM =
  'flex w-full px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70 disabled:opacity-40';

export function CompanyOverflowMenu({
  open,
  items,
  muted,
  mutePending,
  onClose,
  onShare,
  onMute,
  onPickMute,
  onBlock,
  onRemove,
}: {
  open: boolean;
  items: ShopOverflowItem[];
  muted: boolean;
  mutePending?: boolean;
  onClose: () => void;
  onShare: () => void;
  onMute: () => void;
  onPickMute: (muteFor: MuteFor) => void;
  onBlock: () => void;
  onRemove: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mutePick, setMutePick] = useState(false);
  const [host, setHost] = useState<{
    top: number;
    left: number;
    right: number;
    bottom: number;
  } | null>(null);

  useEffect(() => {
    if (!open) setMutePick(false);
  }, [open]);

  useEffect(() => {
    if (!mutePick) {
      setHost(null);
      return;
    }
    const box = panelRef.current?.getBoundingClientRect();
    if (box) setHost({ top: box.top, left: box.left, right: box.right, bottom: box.bottom });
  }, [mutePick]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (mutePick) {
        setMutePick(false);
        return;
      }
      onClose();
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open, onClose, mutePick]);

  if (!open) return null;

  return (
    <>
      <div
        ref={panelRef}
        role="menu"
        data-testid="company-overflow-menu"
        className="absolute right-0 top-full z-40 mt-1 min-w-[11.5rem] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[var(--shadow-soft)]"
      >
        {items.map((item, index) => {
          if (item === 'share') {
            return (
              <button
                key={item}
                type="button"
                role="menuitem"
                data-testid="company-overflow-share"
                className={cx(ITEM, index > 0 ? 'border-t border-line/70' : '')}
                onClick={() => {
                  onClose();
                  onShare();
                }}
              >
                Share
              </button>
            );
          }
          if (item === 'mute') {
            return (
              <button
                key={item}
                type="button"
                role="menuitem"
                data-testid="company-overflow-mute"
                disabled={mutePending}
                aria-expanded={!muted && mutePick}
                className={cx(
                  ITEM,
                  index > 0 ? 'border-t border-line/70' : '',
                  mutePick && !muted ? 'bg-accent/5' : '',
                )}
                onClick={() => {
                  if (muted) {
                    onMute();
                    return;
                  }
                  setMutePick((openMute) => !openMute);
                }}
              >
                {muted ? 'Unmute' : 'Mute'}
              </button>
            );
          }
          if (item === 'block') {
            return (
              <button
                key={item}
                type="button"
                role="menuitem"
                data-testid="company-overflow-block"
                className={cx(ITEM, index > 0 ? 'border-t border-line/70' : '', 'text-danger')}
                onClick={() => {
                  onClose();
                  onBlock();
                }}
              >
                Block
              </button>
            );
          }
          return (
            <button
              key={item}
              type="button"
              role="menuitem"
              data-testid="company-overflow-remove"
              className={cx(ITEM, index > 0 ? 'border-t border-line/70' : '', 'text-danger')}
              onClick={() => {
                onClose();
                onRemove();
              }}
            >
              Remove connection
            </button>
          );
        })}
      </div>
      {mutePick && !muted
        ? createPortal(
            <ChatMuteDurationFlyout
              host={host}
              pending={mutePending}
              onPick={(muteFor) => {
                setMutePick(false);
                onPickMute(muteFor);
              }}
            />,
            document.body,
          )
        : null}
    </>
  );
}
