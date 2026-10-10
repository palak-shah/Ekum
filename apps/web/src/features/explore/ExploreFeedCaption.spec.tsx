import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ExploreFeedCaption } from './ExploreFeedCaption';

describe('ExploreFeedCaption', () => {
  it('shows rate and categories and omits About when empty', () => {
    render(
      <ExploreFeedCaption
        title="Monsoon Cottons"
        meta="6 designs · 3h ago"
        rateLine="₹430–₹1,450 /pc"
        categoryLine="Saree · Kurti fabric"
        about={null}
      />,
    );
    expect(screen.getByText('Monsoon Cottons')).toBeInTheDocument();
    expect(screen.getByTestId('explore-feed-rate')).toHaveTextContent('₹430–₹1,450 /pc');
    expect(screen.getByTestId('explore-feed-categories')).toHaveTextContent('Saree · Kurti fabric');
    expect(screen.queryByTestId('explore-feed-about')).toBeNull();
  });

  it('expands About without needing a parent link', async () => {
    const user = userEvent.setup();
    render(
      <ExploreFeedCaption
        title="Festive Silks"
        meta="4 designs"
        about="Handloom silks for festive counters."
      />,
    );
    expect(screen.queryByTestId('explore-feed-about-body')).toBeNull();
    await user.click(screen.getByTestId('explore-feed-about'));
    expect(screen.getByTestId('explore-feed-about-body')).toHaveTextContent(
      'Handloom silks for festive counters.',
    );
  });
});
