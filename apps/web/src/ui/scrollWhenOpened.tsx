import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { cx } from '@/ui/kit';

/** Clear sticky header + Create/Update dock so nearest scroll leaves the block operable. */
export const SCROLL_OPENED_MARGIN_CLASS =
  'scroll-mt-[calc(4.5rem+env(safe-area-inset-top))] scroll-mb-[calc(5rem+env(safe-area-inset-bottom))]';

/** Instant nearest scroll so an opened accordion is operable without hunting. */
export function scrollOpenedIntoView(node: HTMLElement | null): void {
  if (!node || typeof node.scrollIntoView !== 'function') return;
  requestAnimationFrame(() => {
    node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
}

/** Scroll the wrapped block into view the moment `open` becomes true. */
export function useScrollWhenOpened(open: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    if (open && !wasOpen.current) {
      scrollOpenedIntoView(ref.current);
    }
    wasOpen.current = open;
  }, [open]);
  return ref;
}

export function ScrollWhenOpened({
  open,
  children,
  className,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  const ref = useScrollWhenOpened(open);
  return (
    <div ref={ref} className={cx(SCROLL_OPENED_MARGIN_CLASS, className)}>
      {children}
    </div>
  );
}
