import { Unit, unitValues } from '@ekum/domain-types';
import { Field, TextInput } from '@/ui/kit';
import { orderDispatchPreview } from './orderDispatchPreview';

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
  const preview = orderDispatchPreview(
    orderUnit || Unit.Set,
    piecesPerPack,
    dispatchUnit || Unit.Piece,
  );
  const containsLabel =
    orderUnit === Unit.Dozen
      ? '1 dozen contains'
      : orderUnit === Unit.Box
        ? '1 box contains'
        : orderUnit === Unit.Bundle
          ? '1 bundle contains'
          : '1 set contains';

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
          value={orderUnit || Unit.Set}
          onChange={(e) => onOrderUnit(e.target.value)}
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
          placeholder="e.g. 4"
        />
      </Field>
      <Field label="Dispatch unit">
        <select
          data-testid="collection-dispatch-unit"
          value={dispatchUnit || Unit.Piece}
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
          placeholder={orderUnit === Unit.Set ? 'Sets' : 'In this unit'}
        />
      </Field>
      <p className="text-xs text-muted" data-testid="collection-order-preview">
        Order preview {preview}
      </p>
    </section>
  );
}
