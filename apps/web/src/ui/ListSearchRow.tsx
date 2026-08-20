import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/ui/kit';

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

export const listSquareButtonClass =
  'flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] border border-line bg-surface text-slate transition-colors hover:bg-foam';

export function ListSquareButton({
  className,
  active,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cx(
        listSquareButtonClass,
        active && 'border-accent bg-accent text-white hover:bg-accent',
        className,
      )}
      {...props}
    />
  );
}
