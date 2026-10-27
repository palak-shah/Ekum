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
  OrderLineMoneyLine,
  orderLineBalance,
  orderLineBalanceRowClass,
} from '@/features/orders/OrderLineFacts';
import {
  ticketUnbilledWash,
  useTicketUnbilledHighlight,
} from '@/features/orders/OrderUnitGroupedList';
import { OrderLineStack } from '@/features/orders/OrderLineStack';
import { OrderDesignTitle } from '@/features/orders/OrderDesignTitle';
import { OrderLineNoteCue } from '@/features/orders/OrderLineNoteCue';
import { CloseIcon, PencilIcon } from '@/ui/icons';
import { Button, TextInput, cx } from '@/ui/kit';
import { COMPACT_QTY_INPUT_CLASS } from '@/ui/mobileOverflow';

type Props = {
  item: OrderItemView;
  canEdit: boolean;
  expanded: boolean;
  busy?: boolean;
  photo: ReactNode;
  onToggle: () => void;
  onCantSupply: (cantSupply: boolean) => void;
  /** Before lock — open Confirm to untick Can’t supply. */
  onOpenQuote?: () => void;
  onSaveQty: (qty: number) => void;
};

/**
 * Uniform stack: thumb · name · fact strip (Balance-tinted card).
 * Expand opens from the quiet pencil only. Edit-only — Can’t supply / Ordered qty.
 * This LR stays on the dock Dispatch sheet.
 */
export function OrderLineFulfillExpand({
  item,
  canEdit,
  expanded,
  busy,
  photo,
  onToggle,
  onCantSupply,
  onOpenQuote,
  onSaveQty,
}: Props) {
  const cantSupply = item.lineStatus === 'declined';
  const extra = orderLineOverShipped(item);
  const showPending = !cantSupply && orderLineShowsPending(item);
  const showExtra = !cantSupply && extra > 0;
  const leftover = orderLineLeftoverCue(item);
  const cue = orderLineCantSupplyCue(cantSupply);
  const balance = orderLineBalance(item);
  const isComplete = !cantSupply && balance?.tone === 'done';
  const unbilledOn = useTicketUnbilledHighlight();
  const showCollapsedSupplyCue = cantSupply && !expanded;
  const quoteFromCue = Boolean(!canEdit && cantSupply && onOpenQuote && showCollapsedSupplyCue);
  const shipped = Math.max(0, Math.floor(item.shippedQuantity ?? 0));
  const agreed = Math.floor(item.quantity);

  const [qtyDraft, setQtyDraft] = useState(String(agreed));

  useEffect(() => {
    if (!expanded) return;
    setQtyDraft(String(agreed));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open / switch line only
  }, [expanded, item.id]);

  const parsed = parseQtyDraft(qtyDraft, agreed);
  const belowShipped = parsed < shipped;
  const qtyDirty = parsed !== agreed && parsed >= 1 && !belowShipped;

  const editControl =
    canEdit ? (
      <button
        type="button"
        className="inline-flex shrink-0 p-1 text-muted/70"
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
        ticketUnbilledWash(item, unbilledOn),
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
          <OrderDesignTitle
            name={item.name}
            muted={cantSupply || Boolean(leftover)}
            extra={<OrderLineMoneyLine item={item} />}
          />
        }
        cues={
          <>
            {leftover ? (
              <p className="text-xs font-emphasis text-ink">{leftover}</p>
            ) : null}
            {showCollapsedSupplyCue && cue ? (
              quoteFromCue ? (
                <button
                  type="button"
                  className="text-left text-xs font-emphasis text-ink"
                  data-testid="order-line-cant-supply-cue"
                  onClick={() => onOpenQuote?.()}
                >
                  {cue}
                </button>
              ) : (
                <p className="text-xs font-emphasis text-ink" data-testid="order-line-cant-supply-cue">
                  {cue}
                </p>
              )
            ) : null}
            {item.note && !expanded ? <OrderLineNoteCue note={item.note} /> : null}
          </>
        }
        nameEnd={editControl}
        facts={!expanded ? <OrderLineFacts item={item} /> : null}
      />

      {expanded && canEdit ? (
        <div className="mt-3 flex flex-col gap-2.5 border-t border-line pt-3" data-testid="order-line-expand">
          <CantSupplySwitch checked={cantSupply} busy={busy} onChange={onCantSupply} />

          <OrderLineFacts item={item} />

          {!cantSupply ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm text-muted" htmlFor={`ordered-${item.id}`}>
                  Ordered
                </label>
                <TextInput
                  id={`ordered-${item.id}`}
                  type="number"
                  min={Math.max(shipped, 1)}
                  inputMode="numeric"
                  data-testid="order-line-ordered-qty"
                  className={COMPACT_QTY_INPUT_CLASS}
                  value={qtyDraft}
                  onChange={(event) => setQtyDraft(event.target.value)}
                />
              </div>
              {belowShipped ? (
                <p className="text-[11px] text-muted">Can’t go below shipped.</p>
              ) : qtyDirty ? (
                <Button
                  variant="secondary"
                  fullWidth
                  data-testid="order-line-qty-save"
                  disabled={busy}
                  onClick={() => onSaveQty(parsed)}
                >
                  Save qty
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
