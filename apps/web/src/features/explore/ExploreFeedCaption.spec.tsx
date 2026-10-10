import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExploreFeedCaption } from './ExploreFeedCaption';
import * as chrome from '@/features/collections/collectionViewerChrome';

afterEach(() => cleanup());

describe('ExploreFeedCaption', () => {
  it('shows rate and categories and omits description when empty', () => {
    render(
      <ExploreFeedCaption
        title="Monsoon Cottons"
        rateLine="₹430–₹1,450 /pc"
        categoryLine="Saree · Kurti fabric"
        about={null}
      />,
    );
    expect(screen.getByText('Monsoon Cottons')).toBeInTheDocument();
    expect(screen.getByTestId('explore-feed-rate')).toHaveTextContent('₹430–₹1,450 /pc');
    expect(screen.getByTestId('explore-feed-categories')).toHaveTextContent('Saree · Kurti fabric');
    expect(screen.queryByTestId('explore-feed-about')).toBeNull();
    expect(screen.queryByTestId('explore-feed-about-body')).toBeNull();
  });

  it('omits muted meta when not passed', () => {
    render(<ExploreFeedCaption title="Festive Silks" rateLine="₹900 /pc" />);
    expect(screen.queryByText(/designs/i)).toBeNull();
  });

  it('preserves newlines and toggles album-style read more', async () => {
    const user = userEvent.setup();
    vi.spyOn(chrome, 'noteBlockOverflows').mockReturnValue(true);
    render(
      <ExploreFeedCaption
        title="Festive Silks"
        about={'Line one.\nLine two.\nLine three.\nLine four.'}
      />,
    );
    const body = screen.getByTestId('explore-feed-about-body');
    expect(body.className).toMatch(/whitespace-pre-wrap/);
    expect(body.textContent).toContain('Line one.\nLine two.');
    const more = screen.getByTestId('explore-feed-about');
    expect(more).toHaveTextContent('read more');
    expect(more.className).toMatch(/absolute/);
    await user.click(more);
    expect(more).toHaveTextContent('Show less');
    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(more.className).not.toMatch(/absolute/);
  });
});
