import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/ui/kit';

/**
 * Fixed above bottom nav — same dock pattern as My Catalog multi-select.
 * Always bottom (Explore is endless; top chrome was wrong).
 */
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
  if (count < 1 || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-x-0 bottom-[4.75rem] z-30 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-md flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">{count} selected</p>
          <button type="button" className="text-xs font-bold text-accent" onClick={onClear}>
            Clear
          </button>
        </div>
        <div className="flex gap-2">
          {extra}
          {onCurate && canCurate ? (
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
      </div>
    </div>,
    document.body,
  );
}
