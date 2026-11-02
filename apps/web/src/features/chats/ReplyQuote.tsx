import type { MessageView } from '@ekum/domain-types';
import { MEDIA_VARIANT, orderReplyQuoteLabel } from '@ekum/domain-types';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { ManagedImage } from '@/ui/ManagedImage';
import { cx } from '@/ui/kit';

export const REPLY_QUOTE_CLASS =
  'mb-1.5 w-full rounded-lg bg-surface/80 px-2 py-1.5 text-left text-sm text-muted';

export function ReplyQuote({
  preview,
  mine,
  onJump,
  orderTag = false,
  fromLabel,
}: {
  preview: NonNullable<MessageView['replyTo']>;
  /** Kept for call sites; both directions use ink-on-bubble reply chrome. */
  mine: boolean;
  onJump?: () => void;
  /** Living-order tag: thumb + Order #, no “Reply”. */
  orderTag?: boolean;
  /** Quoted shop (or You). Unused on order tags. */
  fromLabel?: string;
}) {
  void mine;
  const className = cx(REPLY_QUOTE_CLASS, onJump && 'hover:bg-canvas active:bg-canvas');
  const thumb = preview.photoUrl ? toAbsoluteMediaUrl(preview.photoUrl) : null;
  const orderLine = orderTag
    ? orderReplyQuoteLabel({
        kind: preview.type === 'rate' ? 'rate' : 'order',
        name: preview.bodyPreview,
        orderLabel: preview.bodyPreview,
      }) ??
      preview.bodyPreview ??
      'Order'
    : null;
  const body = (
    <span className="flex items-center gap-2">
      {thumb ? (
        <ManagedImage
          src={thumb}
          alt=""
          variant={MEDIA_VARIANT.Thumbnail1}
          className="h-9 w-9 shrink-0 rounded-md object-cover"
        />
      ) : null}
      <span className="min-w-0 flex-1">
        {orderTag ? (
          <p className="truncate font-emphasis text-accent">{orderLine}</p>
        ) : (
          <>
            <p className="font-emphasis text-accent">{fromLabel?.trim() || 'Message'}</p>
            <p className="truncate">{preview.bodyPreview ?? 'Message'}</p>
          </>
        )}
      </span>
    </span>
  );
  if (!onJump) {
    return (
      <div className={className} data-testid={orderTag ? 'chat-order-tag' : 'chat-reply-quote'}>
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      className={className}
      data-testid={orderTag ? 'chat-order-tag' : 'chat-reply-quote'}
      onClick={(event) => {
        event.stopPropagation();
        onJump();
      }}
    >
      {body}
    </button>
  );
}
