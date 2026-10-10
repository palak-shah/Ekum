import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  parseSharedQtyDraft,
  SameQtyRateForAll,
  SameRateForAll,
} from './quoteSameRate';
import { sameQtyRateForAllChipLabel } from './QtyStepper';

afterEach(() => cleanup());

describe('parseSharedQtyDraft', () => {
  it('accepts whole pieces ≥1', () => {
    expect(parseSharedQtyDraft('50')).toBe(50);
    expect(parseSharedQtyDraft('')).toBeNull();
    expect(parseSharedQtyDraft('0')).toBeNull();
  });
});

describe('sameQtyRateForAllChipLabel', () => {
  it('shows applied qty and/or rate on the chip', () => {
    expect(sameQtyRateForAllChipLabel(null, '')).toBe('Same for all');
    expect(sameQtyRateForAllChipLabel(50, '')).toBe('Same for all · 50');
    expect(sameQtyRateForAllChipLabel(null, '2450')).toBe('Same for all · ₹2450');
    expect(sameQtyRateForAllChipLabel(50, '2450')).toBe('Same for all · 50 · ₹2450');
  });
});

describe('SameQtyRateForAll', () => {
  it('opens Qty and Rate; Apply when either is filled', async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <SameQtyRateForAll
        show
        open={false}
        qtyDraft=""
        rateDraft=""
        appliedQty={null}
        appliedRate=""
        onOpen={vi.fn()}
        onQtyDraftChange={vi.fn()}
        onRateDraftChange={vi.fn()}
        onApply={onApply}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId('same-for-all-chip')).toHaveTextContent('Same for all');

    rerender(
      <SameQtyRateForAll
        show
        open
        qtyDraft="40"
        rateDraft=""
        appliedQty={null}
        appliedRate=""
        onOpen={vi.fn()}
        onQtyDraftChange={vi.fn()}
        onRateDraftChange={vi.fn()}
        onApply={onApply}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId('same-qty-for-all-input')).toHaveValue(40);
    expect(screen.getByTestId('same-rate-for-all-input')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledOnce();
  });

  it('opens stacked Qty|Rate with Apply under the fields', () => {
    render(
      <SameQtyRateForAll
        show
        open
        qtyDraft="20"
        rateDraft="110"
        appliedQty={null}
        appliedRate=""
        onOpen={vi.fn()}
        onQtyDraftChange={vi.fn()}
        onRateDraftChange={vi.fn()}
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId('same-for-all-editor')).toBeTruthy();
    expect(screen.getByTestId('same-qty-rate-for-all-fields')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  });

  it('Confirm decideRows aligns fields to tick · thumb · Qty|Rate columns', () => {
    render(
      <SameQtyRateForAll
        show
        open
        alignWith="decideRows"
        qtyDraft="20"
        rateDraft="110"
        appliedQty={null}
        appliedRate=""
        onOpen={vi.fn()}
        onQtyDraftChange={vi.fn()}
        onRateDraftChange={vi.fn()}
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId('same-for-all-editor')).toHaveAttribute(
      'data-align',
      'decide-rows',
    );
    expect(screen.getByTestId('same-for-all-thumb')).toHaveTextContent('Same for all');
  });

  it('disables Apply when both drafts are empty', () => {
    render(
      <SameQtyRateForAll
        show
        open
        qtyDraft=""
        rateDraft=""
        appliedQty={null}
        appliedRate=""
        onOpen={vi.fn()}
        onQtyDraftChange={vi.fn()}
        onRateDraftChange={vi.fn()}
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });
});

describe('SameRateForAll', () => {
  it('keeps mill rate-only editor', async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();
    render(
      <SameRateForAll
        show
        open
        draft="85"
        applied=""
        onOpen={vi.fn()}
        onDraftChange={vi.fn()}
        onApply={onApply}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Same rate for all designs')).toHaveValue('85');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledOnce();
  });
});
