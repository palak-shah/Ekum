import { isPackOrderUnit, Unit, unitValues } from '@ekum/domain-types';
import { Field, TextInput } from '@/ui/kit';
import { orderContentsUnit, orderDispatchPreview } from './orderDispatchPreview';

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
}) {
  const order = orderUnit || Unit.Set;
  const dispatch = dispatchUnit.trim() || order;
  const contentsUnit = orderContentsUnit(order, dispatch);
  const preview = orderDispatchPreview(order, piecesPerPack, dispatch);
  const containsLabel =
    orderUnit === Unit.Dozen
      ? '1 dozen contains'
      : orderUnit === Unit.Box
        ? '1 box contains'
        : orderUnit === Unit.Bundle
          ? '1 bundle contains'
          : '1 set contains';
  const containsPlaceholder = `4 ${contentsUnit}`;

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
        <h2 className="text-sm font-semibold text-ink">Order and dispatch</h2>
      )}
      <Field label="Order taken in">
        <select
          data-testid="collection-order-unit"
          value={order}
          onChange={(e) => handleOrderUnit(e.target.value)}
          className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink"
        >
          {unitValues.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </Field>
      <Field label={containsLabel}>
        <TextInput
          data-testid="collection-set-contains"
          value={piecesPerPack}
          onChange={(e) => onPiecesPerPack(e.target.value)}
          inputMode="numeric"
          placeholder={containsPlaceholder}
        />
      </Field>
      <Field label="Dispatch unit">
        <select
          data-testid="collection-dispatch-unit"
          value={dispatch}
          onChange={(e) => onDispatchUnit(e.target.value)}
          className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink"
        >
          {unitValues.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
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
