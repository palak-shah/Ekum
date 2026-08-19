import type { ReactNode } from 'react';
import { Button } from '@/ui/kit';

export function BrowseSelectBar({
  count,
  onClear,
  onOrder,
  onCurate,
  canOrder = true,
  canCurate = true,
  orderLabel = 'Order',
  curateLabel = 'Curate',
  extra,
}: {
  count: number;
  onClear: () => void;
  onOrder?: () => void;
  onCurate?: () => void;
  canOrder?: boolean;
  canCurate?: boolean;
  orderLabel?: string;
  curateLabel?: string;
  extra?: ReactNode;
}) {
  if (count < 1) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-30 mx-auto flex max-w-md flex-col gap-2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 text-sm font-bold tracking-tight text-ink">
          {count} selected
        </p>
        <button type="button" className="text-xs font-bold text-muted" onClick={onClear}>
          Clear
        </button>
        {extra}
        {onCurate && canCurate ? (
          <Button variant="secondary" onClick={onCurate}>
            {curateLabel}
          </Button>
        ) : null}
        {onOrder && canOrder ? <Button onClick={onOrder}>{orderLabel}</Button> : null}
      </div>
    </div>
  );
}
