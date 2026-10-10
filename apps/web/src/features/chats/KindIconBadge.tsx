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
  /** Translucent white icon when sitting on a solid dark accent fill (legacy). */
  onAccent?: boolean;
}) {
  const { Icon } = chatTypeMeta(messageType);
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-md',
        /* Soft accent wash — not canvas white (clashes on chat-out green cards). */
        onAccent ? 'bg-white/15 text-white' : 'bg-accent/10 text-accent',
      )}
      style={{ width: size, height: size }}
    >
      <Icon width={iconSize} height={iconSize} aria-hidden />
    </span>
  );
}
