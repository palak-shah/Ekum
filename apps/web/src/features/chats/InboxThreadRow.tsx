import { useRef, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { type ThreadSummary } from '@ekum/domain-types';
import { timeAgo } from '@/lib/format';
import { Avatar, cx } from '@/ui/kit';
import { PinIcon } from '@/ui/icons';
import { LONG_PRESS_SURFACE_CLASS, useLongPress } from '@/ui/useLongPress';
import { threadDisplayTitle } from './chatsListSearch';
import { threadVisibilityLabel } from './threadVisibilityLabel';
import { inboxObjectLabel, inboxPreviewTypeKey, messagePreviewText } from './messagePreview';
import { getChatDraft, subscribeChatDrafts } from './chatsDrafts';
import {
  inboxSwipeAxis,
  inboxSwipeReveal,
  inboxSwipeSettle,
} from './inboxRowSwipe';

export function InboxThreadRow({
  thread,
  selecting,
  selected,
  canMenu,
  onMenu,
  onToggle,
  onArchive,
}: {
  thread: ThreadSummary;
  selecting: boolean;
  selected: boolean;
  canMenu: boolean;
  onMenu: (rect: { top: number; bottom: number; right: number } | null) => void;
  onToggle: () => void;
  onArchive?: () => void;
}) {
  const draft = useSyncExternalStore(
    subscribeChatDrafts,
    () => getChatDraft(thread.id),
    () => '',
  );
  const title = threadDisplayTitle(thread);
  const visibility = threadVisibilityLabel(thread);
  const whyLine = thread.searchHitPreview?.trim() || null;
  const draftLine = !whyLine && draft.trim() ? `Draft: ${draft.trim()}` : null;
  const preview = whyLine ?? draftLine ?? messagePreviewText(thread.lastMessage);
  const objectLabel =
    !whyLine && !draftLine && thread.lastMessage
      ? inboxObjectLabel(inboxPreviewTypeKey(thread.lastMessage))
      : null;
  const to =
    whyLine && thread.searchHitMessageId
      ? `/chats/${thread.id}?message=${encodeURIComponent(thread.searchHitMessageId)}`
      : `/chats/${thread.id}`;

  const body = (
    <>
      <Avatar name={title} imageUrl={thread.counterpart?.logoUrl} size={48} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1 text-[15px] font-semibold leading-tight tracking-[-0.02em] text-ink">
            {thread.pinned ? (
              <PinIcon width={12} height={12} className="shrink-0 text-slate" aria-hidden />
            ) : null}
            <span className="truncate">{title}</span>
            {visibility ? (
              <span className="shrink-0 text-[11px] font-medium text-muted">· {visibility}</span>
            ) : null}
          </p>
          <span
            className={cx(
              'shrink-0 text-[11px] tabular-nums',
              thread.unreadCount > 0 ? 'font-bold text-accent' : 'font-medium text-muted',
            )}
          >
            {timeAgo(thread.lastMessageAt)}
          </span>
        </div>
        {objectLabel ? (
          <p className="text-[11px] font-medium tracking-tight text-accent">{objectLabel}</p>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          <p
            className={cx(
              'min-w-0 truncate text-[13px] font-normal leading-snug',
              draftLine ? 'font-medium text-accent' : 'text-muted',
            )}
          >
            {preview}
          </p>
          {thread.unreadCount > 0 ? (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">
              {thread.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  const rowClass = cx(
    LONG_PRESS_SURFACE_CLASS,
    'flex w-full items-center gap-3 border-b border-line/70 px-4 py-3 text-left last:border-b-0',
    selected ? 'border-accent bg-accent/5' : 'hover:bg-canvas active:bg-canvas',
  );
  const rowRef = useRef<HTMLAnchorElement>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const dragXRef = useRef(0);
  const axisRef = useRef<'x' | 'y' | null>(null);
  const didSwipeRef = useRef(false);
  const [dragX, setDragX] = useState(0);
  const reveal = inboxSwipeReveal(dragX);

  const setDrag = (next: number) => {
    dragXRef.current = next;
    setDragX(next);
  };
  const longPress = useLongPress(
    canMenu
      ? () => {
          const box = rowRef.current?.getBoundingClientRect();
          onMenu(box ? { top: box.top, bottom: box.bottom, right: box.right } : null);
        }
      : undefined,
  );

  if (selecting) {
    return (
      <button
        type="button"
        data-testid={`chats-select-row-${thread.id}`}
        aria-pressed={selected}
        className={rowClass}
        onClick={onToggle}
      >
        {body}
      </button>
    );
  }

  const openMenu = () => {
    const box = rowRef.current?.getBoundingClientRect();
    onMenu(box ? { top: box.top, bottom: box.bottom, right: box.right } : null);
  };

  return (
    <div className="relative overflow-hidden touch-pan-y" data-testid={`chats-swipe-${thread.id}`}>
      <div className="absolute inset-y-0 right-0 z-0 flex">
        <button
          type="button"
          className="flex w-[4.5rem] items-center justify-center bg-slate text-xs font-bold text-white"
          onClick={() => {
            setDragX(0);
            openMenu();
          }}
        >
          More
        </button>
        <button
          type="button"
          className="flex w-[4.5rem] items-center justify-center bg-success text-xs font-bold text-white"
          onClick={() => {
            setDragX(0);
            onArchive?.();
          }}
        >
          Archive
        </button>
      </div>
      <Link
        ref={rowRef}
        to={to}
        data-testid={`chats-row-${thread.id}`}
        className={cx(rowClass, 'relative z-[1] touch-pan-y bg-surface')}
        style={{ transform: `translateX(${-reveal}px)` }}
        onPointerDown={(event) => {
          startX.current = event.clientX;
          startY.current = event.clientY;
          axisRef.current = null;
          didSwipeRef.current = false;
          longPress.onPointerDown();
        }}
        onPointerMove={(event) => {
          if (startX.current == null || startY.current == null) return;
          const dx = event.clientX - startX.current;
          const dy = event.clientY - startY.current;
          if (axisRef.current == null) {
            axisRef.current = inboxSwipeAxis(dx, dy);
            if (axisRef.current === 'x') {
              try {
                event.currentTarget.setPointerCapture(event.pointerId);
              } catch {
                /* capture is optional on desktop */
              }
              longPress.onPointerCancel();
            }
          }
          if (axisRef.current !== 'x') return;
          didSwipeRef.current = true;
          event.preventDefault();
          setDrag(dx);
        }}
        onPointerUp={() => {
          if (axisRef.current === 'x') {
            setDrag(inboxSwipeSettle(dragXRef.current));
          }
          startX.current = null;
          startY.current = null;
          axisRef.current = null;
          longPress.onPointerUp();
        }}
        onPointerLeave={longPress.onPointerLeave}
        onPointerCancel={() => {
          startX.current = null;
          startY.current = null;
          axisRef.current = null;
          setDrag(0);
          longPress.onPointerCancel();
        }}
        onContextMenu={longPress.onContextMenu}
        onClickCapture={(event) => {
          if (didSwipeRef.current || reveal > 8) {
            event.preventDefault();
            event.stopPropagation();
            if (!didSwipeRef.current) setDrag(0);
            didSwipeRef.current = false;
            return;
          }
          longPress.onClickCapture(event);
        }}
      >
        {body}
      </Link>
    </div>
  );
}
