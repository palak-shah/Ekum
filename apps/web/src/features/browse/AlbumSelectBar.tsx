import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTradePresence } from '@/lib/tradePresence';
import { Button } from '@/ui/kit';
import { pickSelectionLabel, shouldShowAlbumSelectActions } from './albumSelectModel';

/**
 * Explore dock: Order · Curate · Bookmark · Share — same four verbs for
 * designs, collections, or mixed. Order resolve happens after Order is tapped.
 */
export function AlbumSelectBar({
  albumCount,
  designCount = 0,
  onClear,
  onShare,
  onSave,
  onOrder,
  onCurate,
  canShare = true,
  canOrder = true,
  canCurate = true,
  sharing = false,
  saving = false,
  extra,
}: {
  albumCount: number;
  designCount?: number;
  onClear: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onOrder?: () => void;
  onCurate?: () => void;
  canShare?: boolean;
  canOrder?: boolean;
  canCurate?: boolean;
  sharing?: boolean;
  saving?: boolean;
  extra?: ReactNode;
}) {
  const { trading } = useTradePresence();
  const total = albumCount + designCount;
  if (total < 1 || typeof document === 'undefined') return null;

  const shown = shouldShowAlbumSelectActions({ designCount, albumCount, trading });
  const showOrder = Boolean(onOrder && canOrder && shown.order);
  const showCurate = Boolean(onCurate && canCurate && shown.curate);
  const showShare = Boolean(onShare && canShare && shown.share);
  const showBookmark = Boolean(onSave && shown.bookmark);
  const busy = sharing || saving;

  return createPortal(
    <div className="fixed inset-x-0 bottom-[4.75rem] z-30 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-md flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">{pickSelectionLabel(albumCount, designCount)}</p>
          <button type="button" className="text-xs font-bold text-accent" onClick={onClear}>
            Clear
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {extra}
          {showOrder ? (
            <Button className="min-w-0 flex-1" disabled={busy} onClick={onOrder}>
              Order
            </Button>
          ) : null}
          {showCurate ? (
            <Button variant="secondary" className="min-w-0 flex-1" disabled={busy} onClick={onCurate}>
              Curate
            </Button>
          ) : null}
          {showBookmark ? (
            <Button variant="secondary" className="min-w-0 flex-1" disabled={busy} onClick={onSave}>
              {saving ? 'Bookmarking…' : 'Bookmark'}
            </Button>
          ) : null}
          {showShare ? (
            <Button variant="secondary" className="min-w-0 flex-1" disabled={busy} onClick={onShare}>
              {sharing ? 'Sharing…' : 'Share'}
            </Button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
