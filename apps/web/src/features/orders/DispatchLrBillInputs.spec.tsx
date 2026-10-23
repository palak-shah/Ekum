import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  DISPATCH_BILL_NUMBER_PLACEHOLDER,
  DISPATCH_LR_NUMBER_PLACEHOLDER,
  DispatchLrBillInputs,
} from './DispatchLrBillInputs';

describe('DispatchLrBillInputs', () => {
  it('names empty fields LR number and Bill Number/Bale Number', () => {
    render(
      <DispatchLrBillInputs
        lrNumber=""
        billNumber=""
        index={0}
        onLrNumber={() => undefined}
        onBillNumber={() => undefined}
      />,
    );
    expect(screen.getByLabelText('LR number 1')).toHaveAttribute(
      'placeholder',
      DISPATCH_LR_NUMBER_PLACEHOLDER,
    );
    expect(
      screen.getByLabelText(`${DISPATCH_BILL_NUMBER_PLACEHOLDER} 1`),
    ).toHaveAttribute('placeholder', DISPATCH_BILL_NUMBER_PLACEHOLDER);
    expect(screen.getByLabelText('LR number 1')).not.toHaveAttribute(
      'placeholder',
      'Optional',
    );
    expect(screen.getByLabelText('LR number 1').parentElement).toHaveClass(
      'grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)]',
    );
  });

  it('keeps the Nth parcel labeled after the first row', () => {
    const onLr = vi.fn();
    render(
      <DispatchLrBillInputs
        lrNumber=""
        billNumber=""
        index={2}
        onLrNumber={onLr}
        onBillNumber={() => undefined}
      />,
    );
    expect(screen.getByLabelText('LR number 3')).toHaveAttribute(
      'placeholder',
      'LR number',
    );
    expect(
      screen.getByLabelText(`${DISPATCH_BILL_NUMBER_PLACEHOLDER} 3`),
    ).toHaveAttribute('placeholder', DISPATCH_BILL_NUMBER_PLACEHOLDER);
  });
});
