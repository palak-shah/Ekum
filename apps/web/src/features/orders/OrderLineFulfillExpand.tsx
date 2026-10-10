import { useEffect, useState, type ReactNode } from 'react';
import type { OrderItemView } from '@ekum/domain-types';
import { parseQtyDraft } from '@/features/orders/lineFulfillCard';
import {
  orderLineCantSupplyCue,
  orderLineLeftoverCue,
  quoteCantSupplyRowClass,
} from '@/features/orders/quoteSheetItems';
import {
  orderLineOverShipped,
  orderLineShowsPending,
} from '@/features/orders/shipProgressLabel';
import { CantSupplySwitch } from '@/features/orders/CantSupplySwitch';
import {
  OrderLineFacts,
  orderLineBalance,
  orderLineBalanceRowClass,
} from '@/features/orders/OrderLineFacts';
import { OrderLineStack } from '@/features/orders/OrderLineStack';
import { orderLineIdentitySecondary } from '@/features/orders/orderLineIdentity';
import { CloseIcon, PencilIcon } from '@/ui/icons';
import { Button, TextInput, cx } from '@/ui/kit';
import { COMPACT_QTY_INPUT_CLASS } from '@/ui/mobileOverflow';

type Props = {
  item: OrderItemView;
  canEdit: boolean;
  /** Qty of this design on the newest LR (edit = same as Dispatch sheet Edit for that LR). */
  lastLrQty: number;
  hasLastLr: boolean;
  expanded: boolean;
  busy?: boolean;
  photo: ReactNode;
  onToggle: () => void;
  onCantSupply: (cantSupply: boolean) => void;
  /** Before lock — open Send quote to untick Can’t supply. */
  onOpenQuote?: () => void;
  onSaveLastLr: (qty: number) => void;
};

/**
 * Uniform stack: thumb · name/identity · fact strip (Balance-tinted card).
 * Expand opens from the quiet pencil only (not the whole row). Edit-only —
 * Can’t supply / Last LR. New LRs go through the dock Dispatch sheet.
 */
export function OrderLineFulfillExpand({
  item,
  canEdit,
  lastLrQty,
  hasLastLr,
  expanded,
  busy,
  photo,
  onToggle,
  onCantSupply,
  onOpenQuote,
  onSaveLastLr,
}: Props) {
  const cantSupply = item.lineStatus === 'declined';
  const extra = orderLineOverShipped(item);
  const showPending = !cantSupply && orderLineShowsPending(item);
  const showExtra = !cantSupply && extra > 0;
  const leftover = orderLineLeftoverCue(item);
  const cue = orderLineCantSupplyCue(cantSupply);
  const identity = orderLineIdentitySecondary(item);
  const balance = orderLineBalance(item);
  const isComplete = !cantSupply && balance?.tone === 'done';
  /** Collapsed grayed rows: cue only — toggle lives in expand / Send quote. */
  const showCollapsedSupplyCue = cantSupply && !expanded;
  const quoteFromCue = Boolean(!canEdit && cantSupply && onOpenQuote && showCollapsedSupplyCue);

  const [lastLrDraft, setLastLrDraft] = useState(String(lastLrQty));

  useEffect(() => {
    if (!expanded) return;
    setLastLrDraft(String(lastLrQty));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open / switch line only
  }, [expanded, item.id]);

  const lastLrDirty = parseQtyDraft(lastLrDraft, lastLrQty) !== lastLrQty;

  const editControl =
    canEdit ? (
      <button
        type="button"
        className="mt-0.5 inline-flex text-muted/70"
        data-testid={expanded ? 'order-line-close-edit' : 'order-line-edit-icon'}
        aria-expanded={expanded}
        aria-label={expanded ? `Close edit ${item.name}` : `Edit ${item.name}`}
        onClick={onToggle}
      >
        {expanded ? <CloseIcon width={14} height={14} /> : <PencilIcon width={14} height={14} />}
      </button>
    ) : null;

  return (
    <div
      className={cx(
        'rounded-xl px-2 py-2',
        expanded && canEdit && 'bg-accent/5',
        !expanded && !cantSupply && orderLineBalanceRowClass(item),
        !expanded && quoteCantSupplyRowClass(cantSupply),
      )}
      data-testid={
        cantSupply
          ? 'order-line-cant-supply'
          : isComplete
            ? 'order-line-complete'
            : showPending
              ? 'order-line-pending'
              : showExtra
                ? 'order-line-extra'
                : 'order-line-row'
      }
      data-expanded={expanded ? 'true' : 'false'}
    >
      <OrderLineStack
        muted={cantSupply || Boolean(leftover)}
        photo={photo}
        title={
          <p
            className={cx(
              'line-clamp-2 break-words text-sm font-semibold',
              cantSupply || leftover ? 'text-muted' : 'text-ink',
            )}
          >
            {item.name}
          </p>
        }
        secondary={
          identity ? (
            <p
              className="truncate text-[12px] font-medium text-slate"
              data-testid="order-line-identity"
            >
              {identity}
            </p>
          ) : null
        }
        cues={
          <>
            {leftover ? (
              <p className="text-xs font-semibold text-ink">{leftover}</p>
            ) : null}
            {showCollapsedSupplyCue && cue ? (
              quoteFromCue ? (
                <button
                  type="button"
                  className="text-left text-xs font-semibold text-ink"
                  data-testid="order-line-cant-supply-cue"
                  onClick={() => onOpenQuote?.()}
                >
                  {cue}
                </button>
              ) : (
                <p className="text-xs font-semibold text-ink" data-testid="order-line-cant-supply-cue">
                  {cue}
                </p>
              )
            ) : null}
            {item.note && !expanded ? <p className="text-xs text-muted">{item.note}</p> : null}
          </>
        }
        trailing={editControl}
        facts={!expanded ? <OrderLineFacts item={item} /> : null}
      />

      {expanded && canEdit ? (
        <div className="mt-3 flex flex-col gap-2.5 border-t border-line pt-3" data-testid="order-line-expand">
          <CantSupplySwitch checked={cantSupply} busy={busy} onChange={onCantSupply} />

          <OrderLineFacts item={item} />

          {!cantSupply && hasLastLr ? (
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
        </div>
      ) : null}
    </div>
  );
}
