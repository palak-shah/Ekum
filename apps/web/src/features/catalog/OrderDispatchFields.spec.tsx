import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Unit } from '@ekum/domain-types';
import { OrderDispatchFields } from './OrderDispatchFields';

function Harness({
  initialOrderUnit = Unit.Set,
  initialPieces = '',
  initialDispatch = Unit.Set,
}: {
  initialOrderUnit?: string;
  initialPieces?: string;
  initialDispatch?: string;
}) {
  const [orderUnit, setOrderUnit] = useState(initialOrderUnit);
  const [piecesPerPack, setPiecesPerPack] = useState(initialPieces);
  const [dispatchUnit, setDispatchUnit] = useState(initialDispatch);
  const [moq, setMoq] = useState('');
  return (
    <OrderDispatchFields
      orderUnit={orderUnit}
      piecesPerPack={piecesPerPack}
      dispatchUnit={dispatchUnit}
      moq={moq}
      onOrderUnit={setOrderUnit}
      onPiecesPerPack={setPiecesPerPack}
      onDispatchUnit={setDispatchUnit}
      onMoq={setMoq}
    />
  );
}

afterEach(() => cleanup());

describe('OrderDispatchFields set-contains', () => {
  it('defaults dispatch unit select to set (same as order)', () => {
    render(<Harness />);
    expect(screen.getByTestId('collection-order-unit')).toHaveValue(Unit.Set);
    expect(screen.getByTestId('collection-dispatch-unit')).toHaveValue(Unit.Set);
  });

  it('shows placeholder 4 pc when order+dispatch are set (rate unit pc)', () => {
    render(<Harness />);
    expect(screen.getByTestId('collection-set-contains')).toHaveAttribute(
      'placeholder',
      '4 pc',
    );
  });

  it('shows placeholder 4 mtr when dispatch/rate unit is mtr', () => {
    render(<Harness initialDispatch={Unit.Metre} />);
    expect(screen.getByTestId('collection-set-contains')).toHaveAttribute(
      'placeholder',
      '4 mtr',
    );
  });

  it('summarizes contains in rate unit not as 12 sets', async () => {
    const { orderDispatchSectionSummary } = await import('./orderDispatchPreview');
    expect(
      orderDispatchSectionSummary({
        orderUnit: 'set',
        piecesPerPack: '12',
        dispatchUnit: 'set',
        moq: '',
      }),
    ).toBe('set · 12 pcs');
  });

  it('autofills 12 when order unit becomes dozen and field is empty', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.selectOptions(screen.getByTestId('collection-order-unit'), Unit.Dozen);
    expect(screen.getByTestId('collection-set-contains')).toHaveValue('12');
    expect(screen.getByText('1 dozen contains')).toBeTruthy();
  });

  it('does not overwrite a typed set-contains when switching to dozen', async () => {
    const user = userEvent.setup();
    render(<Harness initialPieces="4" />);
    await user.selectOptions(screen.getByTestId('collection-order-unit'), Unit.Dozen);
    expect(screen.getByTestId('collection-set-contains')).toHaveValue('4');
  });

  it('keeps dozen autofill editable', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.selectOptions(screen.getByTestId('collection-order-unit'), Unit.Dozen);
    const input = screen.getByTestId('collection-set-contains');
    await user.clear(input);
    await user.type(input, '10');
    expect(input).toHaveValue('10');
  });
});
