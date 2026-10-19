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
    expect(rate.className).toMatch(/font-body/);
    expect(rate.className).toMatch(/text-accent/);
    expect(rate.className).not.toMatch(/font-emphasis/);
    expect(rate.parentElement).toHaveTextContent('Monsoon Cottons');
    expect(screen.getByTestId('explore-feed-categories')).toHaveTextContent('Saree · Kurti fabric');
    expect(screen.queryByText('More…')).toBeNull();

    rerender(<ExploreFeedCaption title="Monsoon Cottons" categoryLine="Saree" />);
    expect(screen.queryByTestId('explore-feed-rate')).toBeNull();
  });

  it('omits muted meta when not passed', () => {
    render(<ExploreFeedCaption title="Festive Silks" rateLine="₹900/pc" />);
    expect(screen.queryByText(/designs/i)).toBeNull();
  });

  it('does not show the collection description', () => {
    render(<ExploreFeedCaption title="Festive Silks" />);
    expect(screen.queryByText('More…')).toBeNull();
    expect(screen.queryByText(/Line one/)).toBeNull();
  });
});
