import { cx } from '@/ui/kit';
import { chatTypeMeta } from './messagePreview';

export function KindIconBadge({
  messageType,
  size = 20,
  iconSize = 14,
  onAccent = false,
}: {
  messageType: string;
  size?: number;
  iconSize?: number;
  /** White translucent badge when sitting on solid Ekum teal (outgoing). */
  onAccent?: boolean;
}) {
  const { Icon } = chatTypeMeta(messageType);
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-md',
        /* Avoid kind-order-soft / foam wash — that made incoming cards look pale green. */
        onAccent ? 'bg-white/15 text-white' : 'bg-canvas text-accent',
      )}
      style={{ width: size, height: size }}
    >
      <Icon width={iconSize} height={iconSize} aria-hidden />
    </span>
  );
}
