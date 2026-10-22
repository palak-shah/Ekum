import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DispatchLinePreview, DispatchLineRemainder } from './DispatchLinePreview';
import { QtyStepper } from './QtyStepper';

describe('DispatchLinePreview', () => {
  const base = {
    quantity: 50,
    rate: 100,
    unit: 'pc',
    lineStatus: 'confirmed' as const,
    remainingQuantity: 23,
    shippedQuantity: 27,
  };

  function stepper(value: number) {
    return (
      <QtyStepper
        value={value}
        onChange={() => undefined}
        inputTestId="order-dispatch-line-qty"
        aria-label="This LR quantity"
      />
    );
  }

  it('keeps Ordered · Shipped · This LR on one hairline — no Balance column', () => {
    render(<DispatchLinePreview item={base} thisLrControl={stepper(23)} />);
    const strip = screen.getByTestId('order-dispatch-line-preview');
    expect(strip.className).toContain('divide-x');
    expect(strip.className).toContain('minmax(7.25rem,1.4fr)');
    expect(strip).toHaveAttribute('data-density', 'compact');
    expect(screen.getByTestId('order-dispatch-preview-ordered')).toHaveTextContent('Ordered');
    expect(screen.getByTestId('order-dispatch-preview-ordered')).toHaveTextContent('50');
    expect(screen.getByTestId('order-dispatch-preview-shipped')).toHaveTextContent('Shipped');
    expect(screen.getByTestId('order-dispatch-preview-shipped')).toHaveTextContent('27');
    const editor = screen.getByTestId('order-dispatch-preview-this-lr');
    expect(editor).toHaveTextContent('This LR');
    expect(editor.textContent).not.toMatch(/Ship in this LR/i);
    expect(editor).toContainElement(screen.getByTestId('order-dispatch-line-qty'));
    expect(screen.queryByTestId('order-dispatch-preview-balance')).toBeNull();
    expect(screen.queryByText('Balance')).toBeNull();
    expect(screen.queryByTestId('order-line-money-info')).toBeNull();
  });

  it('puts leftover/extra at the name, live with This LR', () => {
    const { rerender } = render(
      <DispatchLineRemainder item={base} thisLrQty={0} includeThisLr={false} />,
    );
    const remainder = screen.getByTestId('order-dispatch-line-remainder');
    expect(remainder).toHaveTextContent('-23');
    expect(remainder.className).toContain('text-[16px]');
    expect(remainder.className).toContain('text-tangerine');
    expect(remainder.className).not.toContain('ring-');

    expect(remainder.className).toContain('mt-2.5');
    expect(remainder.className).toContain('mr-2.5');

    rerender(<DispatchLineRemainder item={base} thisLrQty={23} includeThisLr />);
    expect(screen.queryByTestId('order-dispatch-line-remainder')).toBeNull();

    rerender(<DispatchLineRemainder item={base} thisLrQty={24} includeThisLr />);
    const extra = screen.getByTestId('order-dispatch-line-remainder');
    expect(extra).toHaveTextContent('+1');
    expect(extra.className).toContain('text-tangerine');
    expect(extra.className).not.toMatch(/rounded-full|bg-tangerine|ring-/);
  });
});
