import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { OrderDispatchAccordion } from './OrderDispatchAccordion';

/** Same collapsed job on collection create/edit and add/edit design. */
function PackOrderDispatchAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <OrderDispatchAccordion
      orderUnit="set"
      piecesPerPack="1"
      dispatchUnit="set"
      moq=""
      onOrderUnit={() => undefined}
      onPiecesPerPack={() => undefined}
      onDispatchUnit={() => undefined}
      onMoq={() => undefined}
      open={open}
      onToggle={() => setOpen((v) => !v)}
    />
  );
}

afterEach(() => cleanup());

describe('Order and dispatch accordion (collection + add/edit design)', () => {
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
