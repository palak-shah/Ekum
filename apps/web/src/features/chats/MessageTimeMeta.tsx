import type { OutgoingDeliveryTick } from '@ekum/domain-types';
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

function TickPath({ d }: { d: string }) {
  return (
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export function DeliveryTicks({ state }: { state: OutgoingDeliveryTick }) {
  const seen = state === 'seen';
  const double = state === 'delivered' || state === 'seen';
  const label = state === 'seen' ? 'Seen' : state === 'delivered' ? 'Delivered' : 'Sent';
  const testId =
    state === 'seen' ? 'chat-seen' : state === 'delivered' ? 'chat-delivered' : 'chat-sent';
  return (
    <svg
      viewBox="0 0 16 10"
      width="16"
      height="10"
      role="img"
      aria-label={label}
      data-testid={testId}
      className={cx('shrink-0', seen ? 'text-tick' : 'text-muted')}
    >
      {double ? (
        <>
          <TickPath d="M1.5 5.5 4 8l6-7" />
          <TickPath d="M6.5 8l6-7" />
        </>
      ) : (
        <TickPath d="M4 8l8-7" />
      )}
    </svg>
  );
}

/** @deprecated Prefer DeliveryTicks — kept for older Seen-only call sites. */
export function SeenTicks() {
  return <DeliveryTicks state="seen" />;
}

/** Clock (+ optional delivery ticks) in one cluster — hugs short text or sits under media. */
export function MessageTimeMeta({
  createdAt,
  tick = null,
  /** @deprecated Use `tick="seen"` */
  seen = false,
  hug = false,
  edited = false,
  className,
  testId,
}: {
  createdAt: string;
  tick?: OutgoingDeliveryTick | null;
  seen?: boolean;
  hug?: boolean;
  edited?: boolean;
  className?: string;
  testId?: string;
}) {
  const state: OutgoingDeliveryTick | null = tick ?? (seen ? 'seen' : null);
  const Tag = hug ? 'span' : 'p';
  return (
    <Tag
      data-testid={testId}
      className={cx(
        hug ? MSG_BUBBLE_TIME_HUG_CLASS : MSG_BUBBLE_TIME_CLASS,
        state && 'inline-flex items-baseline justify-end gap-0.5',
        className,
      )}
    >
      {messageClockTime(createdAt)}
      {edited ? ' · Edited' : null}
      {state ? <DeliveryTicks state={state} /> : null}
    </Tag>
  );
}
