import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '@/ui/kit';
import type { MuteFor } from '@ekum/domain-types';
import { placeInboxRowMenu } from './placeInboxRowMenu';
import { ChatMuteDurationFlyout } from './ChatMuteDurationFlyout';

const ITEM =
  'flex w-full px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70 disabled:opacity-40';

export function ChatsInboxRowMenu({
  isGroup,
  pinned,
  muted,
  unread,
  archived,
  pending,
  anchor,
  onClose,
  onPin,
  onMute,
  onPickMute,
  onUnread,
  onArchive,
  onClear,
  onDelete,
  onExitGroup,
}: {
  isGroup: boolean;
  pinned: boolean;
  muted: boolean;
  unread?: boolean;
  archived?: boolean;
  pending?: boolean;
  anchor: { top: number; bottom: number; right: number } | null;
  onClose: () => void;
  onPin: () => void;
  onMute: () => void;
  onPickMute?: (muteFor: MuteFor) => void;
  onUnread?: () => void;
  onArchive: () => void;
  onClear: () => void;
  onDelete: () => void;
  onExitGroup: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mutePick, setMutePick] = useState(false);
  const [host, setHost] = useState<{
    top: number;
    left: number;
    right: number;
    bottom: number;
  } | null>(null);
  const [pos, setPos] = useState(() =>
    placeInboxRowMenu(anchor ?? { top: 80, bottom: 120, right: 320 }, {
      width: typeof window === 'undefined' ? 390 : window.innerWidth,
      height: typeof window === 'undefined' ? 720 : window.innerHeight,
    }),
  );

  useEffect(() => {
    if (!anchor) return;
    const place = () => {
      const box = panelRef.current?.getBoundingClientRect();
      setPos(
        placeInboxRowMenu(anchor, {
          width: window.innerWidth,
          height: window.innerHeight,
        }, box ? { width: box.width, height: box.height } : undefined),
      );
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [anchor, mutePick]);

  useEffect(() => {
    if (!mutePick) {
      setHost(null);
      return;
    }
    const box = panelRef.current?.getBoundingClientRect();
    if (box) setHost({ top: box.top, left: box.left, right: box.right, bottom: box.bottom });
  }, [mutePick, pos.top, pos.left]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (mutePick) {
        setMutePick(false);
        return;
      }
      onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, mutePick]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close menu"
        className="fixed inset-0 z-[60] cursor-default bg-ink/15"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="menu"
        data-testid="chats-row-menu"
        className="fixed z-[61] min-w-[11rem] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[var(--shadow-soft)]"
        style={{ top: pos.top, left: pos.left }}
      >
        <button type="button" role="menuitem" data-testid="chats-row-pin" disabled={pending} className={ITEM} onClick={onPin}>
          {pinned ? 'Unpin chat' : 'Pin chat'}
        </button>
        {!unread && onUnread ? (
          <button
            type="button"
            role="menuitem"
            data-testid="chats-row-unread"
            disabled={pending}
            className={cx(ITEM, 'border-t border-line/70')}
            onClick={onUnread}
          >
            Mark as unread
          </button>
        ) : null}
        <button
          type="button"
          role="menuitem"
          data-testid="chats-row-mute"
          disabled={pending}
          aria-expanded={!muted && mutePick}
          className={cx(ITEM, 'border-t border-line/70', mutePick && !muted ? 'bg-accent/5' : '')}
          onClick={() => {
            if (muted) {
              onMute();
              return;
            }
            setMutePick((open) => !open);
          }}
        >
          {muted ? 'Unmute' : 'Mute'}
        </button>
        <button
          type="button"
          role="menuitem"
          data-testid={archived ? 'chats-row-unarchive' : 'chats-row-archive'}
          disabled={pending}
          className={cx(ITEM, 'border-t border-line/70')}
          onClick={onArchive}
        >
          {archived ? 'Unarchive' : 'Archive'}
        </button>
        <button
          type="button"
          role="menuitem"
          data-testid="chats-row-clear"
          disabled={pending}
          className={cx(ITEM, 'border-t border-line/70')}
          onClick={onClear}
        >
          Clear chat
        </button>
        {isGroup ? (
          <button
            type="button"
            role="menuitem"
            data-testid="chats-row-exit"
            disabled={pending}
            className={cx(ITEM, 'border-t border-line/70 text-danger')}
            onClick={onExitGroup}
          >
            Exit group
          </button>
        ) : (
          <button
            type="button"
            role="menuitem"
            data-testid="chats-row-delete"
            disabled={pending}
            className={cx(ITEM, 'border-t border-line/70 text-danger')}
            onClick={onDelete}
          >
            Delete chat
          </button>
        )}
      </div>
      {mutePick && !muted && onPickMute ? (
        <ChatMuteDurationFlyout
          host={host}
          pending={pending}
          onPick={(muteFor) => {
            setMutePick(false);
            onPickMute(muteFor);
          }}
        />
      ) : null}
    </>,
    document.body,
  );
}
