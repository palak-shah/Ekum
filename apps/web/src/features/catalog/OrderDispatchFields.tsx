import { isPackOrderUnit, Unit, unitValues } from '@ekum/domain-types';
import { Field, TextInput } from '@/ui/kit';
import {
  FIELD_FOCUS_WITHIN_FILL_CLASS,
  FIELD_IDLE_FILL_CLASS,
} from '@/ui/fieldFill';
import { OptionSheetField } from '@/ui/OptionSheetField';
import {
  orderContentsUnit,
  orderDispatchPreview,
  setContainsUnitLabel,
} from './orderDispatchPreview';
import { DEFAULT_DISPATCH_UNIT, DEFAULT_SELL_AS_UNIT } from './publishDefaults';

export function OrderDispatchFields({
  orderUnit,
  piecesPerPack,
  dispatchUnit,
  moq,
  onOrderUnit,
  onPiecesPerPack,
  onDispatchUnit,
  onMoq,
  hideHeading = false,
  contentsUnit: contentsUnitProp,
}: {
  orderUnit: string;
  piecesPerPack: string;
  dispatchUnit: string;
  moq: string;
  onOrderUnit: (next: string) => void;
  onPiecesPerPack: (next: string) => void;
  onDispatchUnit: (next: string) => void;
  onMoq: (next: string) => void;
  /** When wrapped in CollectionExpandableSection (collection create/edit). */
  hideHeading?: boolean;
  /** Rate per unit — “1 set contains” suffix must match collection details. */
  contentsUnit?: string;
}) {
  const order = orderUnit || DEFAULT_SELL_AS_UNIT;
  // Dispatch = delivery journey unit (platform usual set) — not the rate unit (pc).
  const dispatch = dispatchUnit.trim() || DEFAULT_DISPATCH_UNIT;
  const contentsUnit = contentsUnitProp?.trim() || orderContentsUnit(order, dispatch);
  const preview = orderDispatchPreview(order, piecesPerPack, dispatch, 10, contentsUnit);
  const containsLabel =
    orderUnit === Unit.Dozen
      ? '1 dozen contains'
      : orderUnit === Unit.Box
        ? '1 box contains'
        : orderUnit === Unit.Bundle
          ? '1 bundle contains'
          : '1 set contains';
  const containsPlaceholder = '4';
  const containsUnitLabel = setContainsUnitLabel(piecesPerPack, contentsUnit);

  const handleOrderUnit = (next: string) => {
    if (next === Unit.Dozen && !piecesPerPack.trim()) {
      onPiecesPerPack('12');
    }
    // Keep dispatch journey with the order pack unit when it still matched.
    if (isPackOrderUnit(next) && (!dispatchUnit.trim() || dispatchUnit === order)) {
      onDispatchUnit(next);
    }
    onOrderUnit(next);
  };

  return (
    <section
      className="flex flex-col gap-3"
      data-testid={hideHeading ? 'collection-order-dispatch-fields' : 'collection-order-dispatch'}
    >
      {hideHeading ? null : (
        <h2 className="text-sm font-emphasis text-ink">Order and dispatch</h2>
      )}
      <Field label="Order taken in">
        <OptionSheetField
          testId="collection-order-unit"
          sheetTitle="Order taken in"
          value={order}
          options={unitValues.map((u) => ({ value: u, label: u }))}
          onChange={handleOrderUnit}
        />
      </Field>
      <Field label={containsLabel}>
        <div
          className={`flex min-h-10 w-fit items-center gap-1 rounded-xl border border-line ${FIELD_IDLE_FILL_CLASS} px-3 text-sm ${FIELD_FOCUS_WITHIN_FILL_CLASS}`}
          data-testid="collection-set-contains-cluster"
        >
          <TextInput
            data-testid="collection-set-contains"
            className="min-h-0 w-12 min-w-12 max-w-12 shrink-0 border-0 bg-transparent px-1 text-center text-base tabular-nums text-ink focus:border-transparent"
            value={piecesPerPack}
            onChange={(e) => {
              const next = e.target.value;
              if (next.trim() === '0' || next.trim() === '00') {
                onPiecesPerPack('');
                return;
              }
              onPiecesPerPack(next);
            }}
            inputMode="numeric"
            placeholder={containsPlaceholder}
            aria-label={containsLabel}
          />
          <span
            className="shrink-0 font-body text-muted"
            data-testid="collection-set-contains-unit"
            aria-hidden
          >
            {containsUnitLabel}
          </span>
        </div>
      </Field>
      <Field label="Dispatch unit">
        <OptionSheetField
          testId="collection-dispatch-unit"
          sheetTitle="Dispatch unit"
          value={dispatch}
          options={unitValues.map((u) => ({ value: u, label: u }))}
          onChange={onDispatchUnit}
        />
      </Field>
      <Field label="Minimum order">
        <TextInput
          data-testid="collection-moq"
          value={moq}
          onChange={(e) => onMoq(e.target.value)}
          inputMode="numeric"
          placeholder={order === Unit.Set ? 'Sets' : 'In this unit'}
        />
      </Field>
      <p className="text-xs text-muted" data-testid="collection-order-preview">
        Order preview {preview}
      </p>
    </section>
  );
}
