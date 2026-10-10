import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { CollectionExpandableSection } from './CollectionExpandableSection';
import { OrderDispatchFields } from './OrderDispatchFields';
import { orderDispatchSectionSummary } from './orderDispatchPreview';

/** Pack create/edit wrap — same shape as CollectionEditorPage identityFields. */
function PackOrderDispatchAccordion() {
  const [open, setOpen] = useState(false);
  const orderUnit = 'pc';
  const piecesPerPack = '1';
  const dispatchUnit = 'pc';
  const moq = '';
  return (
    <CollectionExpandableSection
      title="Order and dispatch"
      summary={orderDispatchSectionSummary({
        orderUnit,
        piecesPerPack,
        dispatchUnit,
        moq,
      })}
      open={open}
      onToggle={() => setOpen((v) => !v)}
      testId="collection-order-dispatch"
    >
      <OrderDispatchFields
        hideHeading
        orderUnit={orderUnit}
        piecesPerPack={piecesPerPack}
        dispatchUnit={dispatchUnit}
        moq={moq}
        onOrderUnit={() => undefined}
        onPiecesPerPack={() => undefined}
        onDispatchUnit={() => undefined}
        onMoq={() => undefined}
      />
    </CollectionExpandableSection>
  );
}

afterEach(() => cleanup());

describe('Order and dispatch accordion (collection create/edit)', () => {
  it('starts collapsed — fields hidden until opened', async () => {
    const user = userEvent.setup();
    render(<PackOrderDispatchAccordion />);
    const toggle = screen.getByTestId('collection-order-dispatch-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('collection-order-unit')).toBeNull();
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('collection-order-unit')).toBeInTheDocument();
  });
});
