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
  contentsUnit,
}: {
  initialOrderUnit?: string;
  initialPieces?: string;
  initialDispatch?: string;
  contentsUnit?: string;
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
      contentsUnit={contentsUnit}
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
    expect(screen.getByTestId('collection-order-unit').className).toContain('bg-input');
    expect(screen.getByTestId('collection-dispatch-unit').className).toContain('bg-input');
  });

  it('falls back empty dispatch to set even when order unit is mtr', () => {
    render(<Harness initialOrderUnit={Unit.Metre} initialDispatch="" />);
    expect(screen.getByTestId('collection-order-unit')).toHaveValue(Unit.Metre);
    expect(screen.getByTestId('collection-dispatch-unit')).toHaveValue(Unit.Set);
  });

  it('shows placeholder 4 with pc suffix when empty', () => {
    render(<Harness />);
    expect(screen.getByTestId('collection-set-contains')).toHaveAttribute(
      'placeholder',
      '4',
    );
    expect(screen.getByTestId('collection-set-contains-unit')).toHaveTextContent('pc');
  });

  it('shows mtr suffix when dispatch/rate unit is mtr', () => {
    render(<Harness initialDispatch={Unit.Metre} />);
    expect(screen.getByTestId('collection-set-contains-unit')).toHaveTextContent('mtr');
  });

  it('uses Rate per (contentsUnit) even when dispatch is still set', () => {
    render(<Harness contentsUnit={Unit.Metre} />);
    expect(screen.getByTestId('collection-set-contains-unit')).toHaveTextContent('mtr');
  });

  it('treats typed 0 as not given and keeps Rate per unit', async () => {
    const user = userEvent.setup();
    render(<Harness initialPieces="4" contentsUnit={Unit.Metre} />);
    const input = screen.getByTestId('collection-set-contains');
    await user.clear(input);
    await user.type(input, '0');
    expect(input).toHaveValue('');
    expect(screen.getByTestId('collection-set-contains-unit')).toHaveTextContent('mtr');
  });

  it('hides the 4 placeholder while the field is focused', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByTestId('collection-set-contains');
    expect(input).toHaveAttribute('placeholder', '4');
    await user.click(input);
    expect(input).not.toHaveAttribute('placeholder');
  });

  it('keeps typed digits in the value (not a vanishing 4ch box)', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByTestId('collection-set-contains');
    await user.click(input);
    await user.type(input, '39');
    expect(input).toHaveValue('39');
    expect(input).toHaveClass('w-12');
  });

  it('shows n unit while they type (4 pcs)', () => {
    render(<Harness initialPieces="4" />);
    expect(screen.getByTestId('collection-set-contains')).toHaveValue('4');
    expect(screen.getByTestId('collection-set-contains-unit')).toHaveTextContent('pcs');
  });

  it('keeps the unit next to the number (not at the far right)', () => {
    render(<Harness initialPieces="4" />);
    const cluster = screen.getByTestId('collection-set-contains-cluster');
    expect(cluster).toHaveClass('w-fit');
    const input = screen.getByTestId('collection-set-contains');
    // 4ch + text-right hid typed digits (caret still blinked). Same box as − n +.
    expect(input).toHaveClass('w-12');
    expect(input).toHaveClass('text-center');
    expect(input).toHaveClass('text-base');
    expect(input).not.toHaveClass('flex-1');
    expect(input).not.toHaveClass('w-[4ch]');
    expect(input).not.toHaveClass('text-right');
  });

  it('keeps singular unit at 1 pc', () => {
    render(<Harness initialPieces="1" />);
    expect(screen.getByTestId('collection-set-contains-unit')).toHaveTextContent('pc');
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
    expect(
      orderDispatchSectionSummary({
        orderUnit: 'set',
        piecesPerPack: '47',
        dispatchUnit: 'set',
        moq: '',
        contentsUnit: 'mtr',
      }),
    ).toBe('set · 47 mtrs');
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
