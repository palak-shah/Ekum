import { useRef, useSyncExternalStore } from 'react';
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

export function InboxThreadRow({
  thread,
  selecting,
  selected,
  canMenu,
  onMenu,
  onToggle,
}: {
  thread: ThreadSummary;
  selecting: boolean;
  selected: boolean;
  canMenu: boolean;
  onMenu: (rect: { top: number; bottom: number; right: number } | null) => void;
  onToggle: () => void;
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
      <Avatar name={title} imageUrl={thread.counterpart?.logoUrl} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1.5 text-[16px] font-semibold tracking-[-0.02em] text-ink">
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
          <p className="mt-0.5 text-[12px] font-medium tracking-tight text-accent">{objectLabel}</p>
        ) : null}
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={cx(
              'min-w-0 truncate text-[13px] font-normal',
              draftLine ? 'font-medium text-accent' : 'text-muted',
            )}
          >
            {preview}
          </p>
          {thread.unreadCount > 0 ? (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-white">
              {thread.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  const rowClass = cx(
    LONG_PRESS_SURFACE_CLASS,
    'flex w-full items-start gap-3 border-b border-line/70 px-4 py-3.5 text-left last:border-b-0',
    selected ? 'border-accent bg-accent/5' : 'hover:bg-canvas active:bg-canvas',
  );
  const rowRef = useRef<HTMLAnchorElement>(null);
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

  return (
    <Link
      ref={rowRef}
      to={to}
      data-testid={`chats-row-${thread.id}`}
      className={rowClass}
      {...longPress}
    >
      {body}
    </Link>
  );
}
