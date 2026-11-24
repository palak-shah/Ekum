import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ExploreFeedCaption } from './ExploreFeedCaption';

afterEach(() => cleanup());

describe('ExploreFeedCaption', () => {
  it('puts the rate on the name row and omits it when there is no price', () => {
    const { rerender } = render(
      <ExploreFeedCaption
        title="Monsoon Cottons"
        rateLine="₹430–₹1,450/pc"
        categoryLine="Saree · Kurti fabric"
      />,
    );
    const rate = screen.getByTestId('explore-feed-rate');
    expect(rate).toHaveTextContent('₹430–₹1,450/pc');
    expect(rate.className).toMatch(/font-emphasis/);
    expect(rate.className).toMatch(/text-accent/);
    expect(rate.className).not.toMatch(/font-body/);
    expect(rate.parentElement).toHaveTextContent('Monsoon Cottons');
    expect(screen.getByTestId('explore-feed-categories')).toHaveTextContent('Saree · Kurti fabric');
    expect(screen.queryByText('More…')).toBeNull();

    rerender(<ExploreFeedCaption title="Monsoon Cottons" categoryLine="Saree" />);
    expect(screen.queryByTestId('explore-feed-rate')).toBeNull();
  });

  it('puts Fabric left and quiet chrome right on one row', () => {
    render(
      <ExploreFeedCaption
        title="Festive Silks"
        categoryLine="Fabric"
        supplierRateLabel="Supplier ₹85/mtr"
      />,
    );
    expect(screen.queryByTestId('explore-feed-rate')).toBeNull();
    const cats = screen.getByTestId('explore-feed-categories');
    const supplier = screen.getByTestId('explore-feed-supplier-rate');
    expect(cats).toHaveTextContent('Fabric');
    expect(supplier).toHaveTextContent('Supplier ₹85/mtr');
    expect(cats.parentElement).toBe(supplier.parentElement?.parentElement);
  });

  it('shows Margin-only quiet chrome without a resulting rate line', () => {
    render(
      <ExploreFeedCaption
        title="Festive Silks"
        categoryLine="Fabric"
        marginLabel="Margin ₹465"
      />,
    );
    expect(screen.queryByTestId('explore-feed-rate')).toBeNull();
    expect(screen.queryByTestId('explore-feed-supplier-rate')).toBeNull();
    expect(screen.getByTestId('explore-feed-margin').textContent).toBe('Margin ₹465');
    expect(screen.getByTestId('explore-feed-categories')).toHaveTextContent('Fabric');
  });

  it('shows quiet new-design meta when provided', () => {
    render(
      <ExploreFeedCaption title="Festive Silks" meta="3 new designs" rateLine="₹900/pc" />,
    );
    expect(screen.getByText('3 new designs')).toBeTruthy();
  });

  it('does not show the collection description', () => {
    render(<ExploreFeedCaption title="Festive Silks" />);
    expect(screen.queryByText('More…')).toBeNull();
    expect(screen.queryByText(/Line one/)).toBeNull();
  });
});
