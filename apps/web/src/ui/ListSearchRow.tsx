import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '@/lib/cx';

/** Shared list chrome: search flexes; one 46×46 trailing square (Explore filter / Chats·Orders +). */
export function ListSearchRow({
  search,
  action,
  className,
}: {
  search: ReactNode;
  action: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('relative flex items-center gap-2', className)}>
      <div className="min-w-0 flex-1">{search}</div>
      {action}
    </div>
  );
}

const listSquareButtonBase =
  'flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] border transition-colors';

export const listSquareButtonClass = cx(
  listSquareButtonBase,
  'border-line bg-surface text-ink hover:bg-foam',
);

export const ListSquareButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }
>(function ListSquareButton({ className, active, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cx(
        listSquareButtonBase,
        active
          ? 'border-accent bg-accent text-white hover:bg-accent'
          : 'border-line bg-surface text-ink hover:bg-foam',
        className,
      )}
      {...props}
    />
  );
});
