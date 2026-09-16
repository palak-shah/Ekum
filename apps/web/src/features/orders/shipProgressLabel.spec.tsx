import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  SettlePendingSummary,
  SettleQtyColumns,
  ShipProgressHint,
  fulfillmentNeedsAttention,
  fulfillmentRowClass,
} from './shipProgressLabel';

describe('ShipProgressHint', () => {
  it('labels remaining as pending with accent, not left', () => {
    render(<ShipProgressHint shipped={50} pending={50} />);
    expect(screen.getByTestId('ship-progress-hint').textContent).toMatch(/shipped/);
    expect(screen.getByTestId('ship-progress-hint').textContent).toMatch(/pending 50/);
    expect(screen.getByTestId('ship-progress-hint').textContent).not.toMatch(/\bleft\b/);
    expect(screen.getByTestId('ship-progress-pending').className).toMatch(/text-accent/);
  });

  it('hides pending when zero', () => {
    render(<ShipProgressHint shipped={100} pending={0} />);
    expect(screen.queryByTestId('ship-progress-pending')).toBeNull();
    expect(screen.getByTestId('ship-progress-hint').textContent).toMatch(/shipped/);
  });
});

describe('SettleQtyColumns', () => {
  it('shows Dispatched and Pending columns with accent pending', () => {
    render(<SettleQtyColumns dispatched={50} pending={50} />);
    expect(screen.getByText('Dispatched')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByTestId('settle-qty-pending').textContent).toBe('50');
    expect(screen.getByTestId('settle-qty-pending').className).toMatch(/text-accent/);
  });
});

describe('fulfillment row highlight', () => {
  it('marks pending rows for accent wash; done rows stay quiet', () => {
    expect(fulfillmentNeedsAttention(50)).toBe(true);
    expect(fulfillmentNeedsAttention(0)).toBe(false);
    expect(fulfillmentRowClass(50)).toMatch(/bg-accent\/5/);
    expect(fulfillmentRowClass(0)).not.toMatch(/bg-accent\/5/);
  });

  it('shows settle summary only when pieces pending', () => {
    const { rerender } = render(<SettlePendingSummary designCount={2} pendingPieces={80} />);
    expect(screen.getByTestId('settle-pending-summary').textContent).toMatch(/2 designs/);
    expect(screen.getByTestId('settle-pending-summary').textContent).toMatch(/80 pending/);
    rerender(<SettlePendingSummary designCount={0} pendingPieces={0} />);
    expect(screen.queryByTestId('settle-pending-summary')).toBeNull();
  });
});
