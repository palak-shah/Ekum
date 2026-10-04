import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  SettlePendingSummary,
  SettleQtyColumns,
  ShipProgressHint,
  fulfillmentNeedsAttention,
  fulfillmentRowClass,
  orderLineShowsFulfillment,
  orderLineShowsPending,
} from './shipProgressLabel';

describe('ShipProgressHint', () => {
  it('always says dispatched N · pending M', () => {
    render(<ShipProgressHint dispatched={50} pending={50} />);
    expect(screen.getByTestId('ship-progress-hint').textContent).toMatch(/dispatched/);
    expect(screen.getByTestId('ship-progress-hint').textContent).toMatch(/pending/);
    expect(screen.getByTestId('ship-progress-hint').textContent).not.toMatch(/shipped/);
    expect(screen.getByTestId('ship-progress-hint').textContent).not.toMatch(/\bleft\b/);
    expect(screen.getByTestId('ship-progress-pending').className).toMatch(/text-accent/);
  });

  it('keeps pending when zero so every line uses the same pair', () => {
    render(<ShipProgressHint dispatched={100} pending={0} />);
    expect(screen.getByTestId('ship-progress-pending').textContent).toMatch(/pending/);
    expect(screen.getByTestId('ship-progress-hint').textContent).toMatch(/dispatched/);
    expect(screen.getByTestId('ship-progress-pending').className).not.toMatch(/text-accent/);
  });

  it('accents pending when nothing has dispatched yet', () => {
    render(<ShipProgressHint dispatched={0} pending={10} />);
    expect(screen.getByTestId('ship-progress-pending').textContent).toMatch(/pending 10/);
    expect(screen.getByTestId('ship-progress-pending').className).toMatch(/text-accent/);
  });

  it('shows accented extra when shipped past agreed qty', () => {
    render(<ShipProgressHint dispatched={2} pending={0} extra={1} />);
    expect(screen.getByTestId('ship-progress-hint').textContent).toMatch(/dispatched 2/);
    expect(screen.getByTestId('ship-progress-extra').textContent).toMatch(/extra 1/);
    expect(screen.getByTestId('ship-progress-extra').className).toMatch(/text-accent/);
    expect(screen.queryByTestId('ship-progress-pending')).toBeNull();
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
    expect(orderLineShowsPending({ remainingQuantity: 10, lineStatus: 'confirmed' })).toBe(true);
    expect(orderLineShowsPending({ remainingQuantity: 10, lineStatus: 'open' })).toBe(false);
    expect(orderLineShowsPending({ remainingQuantity: 0, lineStatus: 'confirmed' })).toBe(false);
  });

  it('shows the pair on fulfilled lines including fully dispatched', () => {
    expect(orderLineShowsFulfillment({ remainingQuantity: 0, shippedQuantity: 2, lineStatus: 'dispatched' })).toBe(
      true,
    );
    expect(orderLineShowsFulfillment({ remainingQuantity: 2, shippedQuantity: 0, lineStatus: 'confirmed' })).toBe(
      true,
    );
    expect(orderLineShowsFulfillment({ remainingQuantity: 2, shippedQuantity: 0, lineStatus: 'open' })).toBe(
      false,
    );
    expect(orderLineShowsFulfillment({ remainingQuantity: 0, shippedQuantity: 0, lineStatus: 'declined' })).toBe(
      false,
    );
  });

  it('shows settle summary only when pieces pending', () => {
    const { rerender } = render(<SettlePendingSummary designCount={2} pendingPieces={80} />);
    expect(screen.getByTestId('settle-pending-summary').textContent).toMatch(/2 designs/);
    expect(screen.getByTestId('settle-pending-summary').textContent).toMatch(/80 pending/);
    rerender(<SettlePendingSummary designCount={0} pendingPieces={0} />);
    expect(screen.queryByTestId('settle-pending-summary')).toBeNull();
  });
});
