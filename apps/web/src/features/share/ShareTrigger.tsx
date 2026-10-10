import { PaperPlaneIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';

/** Opens in-app Universal Share — paper plane, theme stroke via currentColor. */
export function ShareTrigger({
  onClick,
  disabled,
  className,
  iconSize = 22,
  'aria-label': ariaLabel = 'Share',
  'data-testid': testId,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  iconSize?: number;
  'aria-label'?: string;
  'data-testid'?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={cx('inline-flex items-center justify-center text-ink disabled:opacity-40', className)}
    >
      <PaperPlaneIcon width={iconSize} height={iconSize} />
    </button>
  );
}
