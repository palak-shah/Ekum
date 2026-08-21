import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTradePresence } from '@/lib/tradePresence';
import { Button } from '@/ui/kit';

/** Count / Select all live on `SelectAllFloat`; this dock is verbs only. */
export function BrowseSelectBar({
  count,
  onOrder,
  onCurate,
  canOrder = true,
  canCurate = true,
  orderLabel = 'Order',
  curateLabel = 'Curate',
  extra,
}: {
  count: number;
  onOrder?: () => void;
  onCurate?: () => void;
  canOrder?: boolean;
  canCurate?: boolean;
  orderLabel?: string;
  curateLabel?: string;
  extra?: ReactNode;
}) {
  const { trading } = useTradePresence();
  if (count < 1 || typeof document === 'undefined') return null;

  const showCurate = Boolean(onCurate && canCurate && trading);

  return createPortal(
    <div className="fixed inset-x-0 bottom-[4.75rem] z-30 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-md gap-2">
        {extra}
        {showCurate ? (
          <Button variant="secondary" className="min-w-0 flex-1" onClick={onCurate}>
            {curateLabel}
          </Button>
        ) : null}
        {onOrder && canOrder ? (
          <Button className="min-w-0 flex-1" onClick={onOrder}>
            {orderLabel}
          </Button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
