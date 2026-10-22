import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettleLinePreview, SettleLineRemainder } from './SettleLinePreview';
import { TextInput } from '@/ui/kit';

describe('SettleLinePreview', () => {
  const base = {
    quantity: 50,
    rate: 100,
    unit: 'pc',
    lineStatus: 'confirmed' as const,
    remainingQuantity: 23,
    shippedQuantity: 27,
  };

  function finalBox(value: number) {
    return (
      <TextInput
        type="number"
        value={String(value)}
        onChange={() => undefined}
        data-testid="order-settle-line-qty"
        aria-label="Final quantity"
      />
    );
  }

  it('keeps Ordered · Shipped · Final on one hairline — no Balance column', () => {
    render(<SettleLinePreview item={base} finalControl={finalBox(27)} />);
    const strip = screen.getByTestId('order-settle-line-preview');
    expect(strip.className).toContain('divide-x');
    expect(strip.className).toContain('minmax(7.25rem,1.4fr)');
    expect(strip).toHaveAttribute('data-density', 'compact');
    expect(screen.getByTestId('order-settle-preview-ordered')).toHaveTextContent('Ordered');
    expect(screen.getByTestId('order-settle-preview-ordered')).toHaveTextContent('50');
    expect(screen.getByTestId('order-settle-preview-shipped')).toHaveTextContent('Shipped');
    expect(screen.getByTestId('order-settle-preview-shipped')).toHaveTextContent('27');
    const editor = screen.getByTestId('order-settle-preview-final');
    expect(editor).toHaveTextContent('Final');
    expect(editor).toContainElement(screen.getByTestId('order-settle-line-qty'));
    expect(screen.queryByTestId('order-settle-preview-balance')).toBeNull();
    expect(screen.queryByText('Balance')).toBeNull();
    expect(screen.queryByTestId('order-line-money-info')).toBeNull();
  });

  it('puts leftover/extra at the name, live with Final', () => {
    const { rerender } = render(<SettleLineRemainder item={base} finalQty={27} />);
    const remainder = screen.getByTestId('order-settle-line-remainder');
    expect(remainder).toHaveTextContent('-23');
    expect(remainder.className).toContain('text-[16px]');
    expect(remainder.className).toContain('text-tangerine');
    expect(remainder.className).not.toContain('ring-');
    expect(remainder.className).toContain('mt-2.5');
    expect(remainder.className).toContain('mr-2.5');

    const even = { ...base, quantity: 27, remainingQuantity: 0 };
    rerender(<SettleLineRemainder item={even} finalQty={27} />);
    expect(screen.queryByTestId('order-settle-line-remainder')).toBeNull();

    const extraItem = { ...base, shippedQuantity: 51, remainingQuantity: 0 };
    rerender(<SettleLineRemainder item={extraItem} finalQty={51} />);
    const extra = screen.getByTestId('order-settle-line-remainder');
    expect(extra).toHaveTextContent('+1');
    expect(extra.className).toContain('text-tangerine');
    expect(extra.className).not.toMatch(/rounded-full|bg-tangerine|ring-/);
  });
});
