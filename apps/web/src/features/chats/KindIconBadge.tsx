import { kindToneClassesForMessageType } from '@/lib/kindTone';
import { cx } from '@/ui/kit';
import { chatTypeMeta } from './messagePreview';

export function KindIconBadge({
  messageType,
  size = 20,
  iconSize = 14,
}: {
  messageType: string;
  size?: number;
  iconSize?: number;
}) {
  const { Icon } = chatTypeMeta(messageType);
  const tone = kindToneClassesForMessageType(messageType);
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-md',
        tone?.badge ?? 'bg-foam text-accent',
      )}
      style={{ width: size, height: size }}
    >
      <Icon width={iconSize} height={iconSize} aria-hidden />
    </span>
  );
}
