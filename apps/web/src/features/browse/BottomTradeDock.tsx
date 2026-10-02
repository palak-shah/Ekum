import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '@/ui/kit';

/** Hit-test must beat the tab bar / selection chip or Ask · Order feel dead. */
export function bottomTradeDockClass(aboveAppNav: boolean): string {
  return cx(
    'pointer-events-auto fixed inset-x-0 z-50 mx-auto flex max-w-md touch-manipulation gap-2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur',
    aboveAppNav ? 'bottom-20' : 'bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
  );
}

/**
 * Ask / Order / Curate band. Portaled so AppShell overflow + `.ekum-rise`
 * cannot trap `fixed` under the tab bar (same lesson as camera / sheets).
 */
export function BottomTradeDock({
  testId,
  aboveAppNav,
  children,
}: {
  testId: string;
  aboveAppNav: boolean;
  children: ReactNode;
}) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div data-testid={testId} className={bottomTradeDockClass(aboveAppNav)}>
      {children}
    </div>,
    document.body,
  );
}
