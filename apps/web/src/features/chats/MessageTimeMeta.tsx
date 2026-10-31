import { cx } from '@/ui/kit';
import { MSG_BUBBLE_TIME_CLASS, MSG_BUBBLE_TIME_HUG_CLASS } from './messageChrome';

/** In-thread clock (WhatsApp). Inbox rows keep `timeAgo`. */
export function messageClockTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function SeenTicks() {
  return (
    <svg
      viewBox="0 0 16 10"
      width="16"
      height="10"
      role="img"
      aria-label="Seen"
      data-testid="chat-seen"
      className="shrink-0 text-tick"
    >
      <path
        d="M1.5 5.5 4 8l6-7M6.5 8l6-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Clock (+ optional Seen ticks) in one cluster — hugs short text or sits under media. */
export function MessageTimeMeta({
  createdAt,
  seen = false,
  hug = false,
  edited = false,
  className,
  testId,
}: {
  createdAt: string;
  seen?: boolean;
  hug?: boolean;
  edited?: boolean;
  className?: string;
  testId?: string;
}) {
  const Tag = hug ? 'span' : 'p';
  return (
    <Tag
      data-testid={testId}
      className={cx(
        hug ? MSG_BUBBLE_TIME_HUG_CLASS : MSG_BUBBLE_TIME_CLASS,
        seen && 'inline-flex items-baseline justify-end gap-0.5',
        className,
      )}
    >
      {messageClockTime(createdAt)}
      {edited ? ' · Edited' : null}
      {seen ? <SeenTicks /> : null}
    </Tag>
  );
}
