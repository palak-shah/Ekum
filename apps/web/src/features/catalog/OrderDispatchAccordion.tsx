import { CollectionExpandableSection } from './CollectionExpandableSection';
import { OrderDispatchFields } from './OrderDispatchFields';
import { orderDispatchSectionSummary } from './orderDispatchPreview';

/** Collapsed Order and dispatch — same job on collection and add/edit design. */
export function OrderDispatchAccordion({
  orderUnit,
  piecesPerPack,
  dispatchUnit,
  moq,
  onOrderUnit,
  onPiecesPerPack,
  onDispatchUnit,
  onMoq,
  open,
  onToggle,
  testId = 'collection-order-dispatch',
  contentsUnit,
}: {
  orderUnit: string;
  piecesPerPack: string;
  dispatchUnit: string;
  moq: string;
  onOrderUnit: (next: string) => void;
  onPiecesPerPack: (next: string) => void;
  onDispatchUnit: (next: string) => void;
  onMoq: (next: string) => void;
  open: boolean;
  onToggle: () => void;
  testId?: string;
  /** Rate per unit so “1 set contains” matches collection details / Explore. */
  contentsUnit?: string;
}) {
  return (
    <CollectionExpandableSection
      title="Order and dispatch"
      summary={orderDispatchSectionSummary({
        orderUnit,
        piecesPerPack,
        dispatchUnit,
        moq,
        contentsUnit,
      })}
      open={open}
      onToggle={onToggle}
      testId={testId}
    >
      <OrderDispatchFields
        hideHeading
        orderUnit={orderUnit}
        piecesPerPack={piecesPerPack}
        dispatchUnit={dispatchUnit}
        moq={moq}
        contentsUnit={contentsUnit}
        onOrderUnit={onOrderUnit}
        onPiecesPerPack={onPiecesPerPack}
        onDispatchUnit={onDispatchUnit}
        onMoq={onMoq}
      />
    </CollectionExpandableSection>
  );
}
