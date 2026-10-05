import { useEffect, useState, type ReactNode } from 'react';
import type { OrderItemView } from '@ekum/domain-types';
import { parseQtyDraft } from '@/features/orders/lineFulfillCard';
import {
  orderLineCantSupplyCue,
  orderLineLeftoverCue,
  quoteCantSupplyMutedClass,
  quoteCantSupplyRowClass,
} from '@/features/orders/quoteSheetItems';
import {
  orderLineOverShipped,
  orderLineShowsFulfillment,
  orderLineShowsPending,
  ShipProgressHint,
} from '@/features/orders/shipProgressLabel';
import { formatRate } from '@/lib/format';
import { Button, TextInput, cx } from '@/ui/kit';
import { COMPACT_QTY_INPUT_CLASS } from '@/ui/mobileOverflow';

type Props = {
  item: OrderItemView;
  canEdit: boolean;
  canDispatch?: boolean;
  /** Qty of this design on the newest LR (edit = same as Dispatch sheet Edit for that LR). */
  lastLrQty: number;
  hasLastLr: boolean;
  expanded: boolean;
  busy?: boolean;
  photo: ReactNode;
  onToggle: () => void;
  onCantSupply: (cantSupply: boolean) => void;
  onDispatch: (qty: number) => void;
  onSaveLastLr: (qty: number) => void;
};

/**
 * Asked · Already shipped (total) · Last LR (edit past) · Ship now (new).
 * Ship now / Last LR do not live-recompute each other while typing.
 */
export function OrderLineFulfillExpand({
  item,
  canEdit,
  canDispatch = true,
  lastLrQty,
  hasLastLr,
  expanded,
  busy,
  photo,
  onToggle,
  onCantSupply,
  onDispatch,
  onSaveLastLr,
}: Props) {
  const cantSupply = item.lineStatus === 'declined';
  const asked = item.requestedQuantity;
  const alreadyShipped = item.shippedQuantity ?? 0;
  const pending = item.remainingQuantity ?? 0;
  const extra = orderLineOverShipped(item);
  const showPending = !cantSupply && orderLineShowsPending(item);
  const showExtra = !cantSupply && extra > 0;
  const showFulfillment = !cantSupply && orderLineShowsFulfillment(item);
  const leftover = orderLineLeftoverCue(item);
  const cue = orderLineCantSupplyCue(cantSupply);

  const [shipNow, setShipNow] = useState('');
  const [lastLrDraft, setLastLrDraft] = useState(String(lastLrQty));

  useEffect(() => {
    if (!expanded) return;
    const seed = pending > 0 ? String(pending) : alreadyShipped > 0 ? '' : String(asked || 1);
    setShipNow(seed);
    setLastLrDraft(String(lastLrQty));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open / switch line only
  }, [expanded, item.id]);

  const lastLrDirty = parseQtyDraft(lastLrDraft, lastLrQty) !== lastLrQty;

  return (
    <div
      className={cx(
        'rounded-xl px-2 py-2',
        expanded && canEdit && 'border border-accent/40 bg-accent/5',
        !expanded && (showPending || showExtra) && 'border border-accent/40 bg-accent/5',
        !expanded && quoteCantSupplyRowClass(cantSupply),
        !expanded && !(showPending || showExtra) && !cantSupply && 'border border-transparent',
      )}
      data-testid={
        cantSupply
          ? 'order-line-cant-supply'
          : showPending
            ? 'order-line-pending'
            : showExtra
              ? 'order-line-extra'
              : 'order-line-row'
      }
      data-expanded={expanded ? 'true' : 'false'}
    >
      <button
        type="button"
        className="flex w-full items-center gap-3 text-left"
        data-testid="order-line-toggle"
        aria-expanded={expanded}
        onClick={() => {
          if (canEdit) onToggle();
        }}
        disabled={!canEdit}
      >
        <div
          className={cx(
            'flex min-w-0 flex-1 items-center gap-3',
            quoteCantSupplyMutedClass(cantSupply || Boolean(leftover)),
          )}
        >
          {photo}
          <div className="min-w-0 flex-1">
            <p
              className={cx(
                'line-clamp-2 break-words text-sm font-medium',
                cantSupply || leftover ? 'text-muted' : 'text-ink',
              )}
            >
              {item.name}
            </p>
            {!cantSupply ? (
              <p className="text-xs text-muted">
                {asked} asked × {formatRate(item.rate, item.unit)}
              </p>
            ) : (
              <p className="text-xs text-muted">{asked} asked</p>
            )}
            {leftover ? (
              <p className="text-xs font-semibold text-ink">{leftover}</p>
            ) : null}
            {cue ? (
              <p className="text-xs font-semibold text-ink" data-testid="order-line-cant-supply-cue">
                {cue}
              </p>
            ) : null}
            {!expanded && showFulfillment ? (
              <p className="text-[11px] font-medium">
                <ShipProgressHint
                  dispatched={alreadyShipped}
                  pending={pending}
                  extra={extra}
                />
              </p>
            ) : null}
            {item.note && !expanded ? <p className="text-xs text-muted">{item.note}</p> : null}
            {canEdit && !expanded ? (
              <p className="mt-1 text-right text-[11px] text-muted">Tap to edit</p>
            ) : null}
          </div>
        </div>
      </button>

      {expanded && canEdit ? (
        <div className="mt-3 flex flex-col gap-2.5 border-t border-line pt-3" data-testid="order-line-expand">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-ink">Can’t supply</span>
            <button
              type="button"
              role="switch"
              aria-checked={cantSupply}
              data-testid="order-line-cant-supply-toggle"
              disabled={busy}
              className={cx(
                'relative h-6 w-10 shrink-0 rounded-full transition-colors',
                cantSupply ? 'bg-accent' : 'bg-line',
              )}
              onClick={() => onCantSupply(!cantSupply)}
            >
              <span
                className={cx(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  cantSupply ? 'left-4' : 'left-0.5',
                )}
              />
            </button>
          </div>

          {!cantSupply ? (
            <>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-muted">Asked</span>
                <span className="font-semibold tabular-nums text-ink">{asked}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-muted">Already shipped</span>
                <span className="font-semibold tabular-nums text-ink">{alreadyShipped}</span>
              </div>

              {hasLastLr ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm text-muted" htmlFor={`last-lr-${item.id}`}>
                      Last LR
                    </label>
                    <TextInput
                      id={`last-lr-${item.id}`}
                      type="number"
                      min={0}
                      inputMode="numeric"
                      data-testid="order-line-last-lr-qty"
                      className={COMPACT_QTY_INPUT_CLASS}
                      value={lastLrDraft}
                      onChange={(event) => setLastLrDraft(event.target.value)}
                    />
                  </div>
                  {lastLrDirty ? (
                    <Button
                      variant="secondary"
                      fullWidth
                      data-testid="order-line-last-lr-save"
                      disabled={busy}
                      onClick={() => onSaveLastLr(parseQtyDraft(lastLrDraft, lastLrQty))}
                    >
                      Save last LR
                    </Button>
                  ) : (
                    <p className="text-[11px] text-muted">
                      Same as Edit on that dispatch. Older LRs stay as they are.
                    </p>
                  )}
                </div>
              ) : null}

              {canDispatch ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm text-muted" htmlFor={`ship-now-${item.id}`}>
                      Ship now
                    </label>
                    <TextInput
                      id={`ship-now-${item.id}`}
                      type="number"
                      min={1}
                      inputMode="numeric"
                      data-testid="order-line-ship-now"
                      className={COMPACT_QTY_INPUT_CLASS}
                      value={shipNow}
                      onChange={(event) => setShipNow(event.target.value)}
                    />
                  </div>
                  <Button
                    fullWidth
                    data-testid="order-line-dispatch"
                    disabled={busy || parseQtyDraft(shipNow, 0) < 1}
                    onClick={() => onDispatch(parseQtyDraft(shipNow, 0))}
                  >
                    Dispatch
                  </Button>
                </>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
