import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CollectionPackDetails } from './CollectionPackDetails';
import * as chrome from './collectionViewerChrome';

afterEach(() => cleanup());

describe('CollectionPackDetails', () => {
  it('renders rate and description without labels; tags stay labeled', () => {
    render(
      <CollectionPackDetails
        categories={['Kurti', 'Embroidered']}
        description="Festive sets this week."
        rateBand="₹1,200 /pc"
      />,
    );
    const rate = screen.getByTestId('collection-pack-details-rate');
    expect(rate).toHaveTextContent('₹1,200 /pc');
    expect(rate).not.toHaveTextContent(/^Rate/);
    expect(rate.textContent).not.toMatch(/Rate/);
    expect(screen.queryByTestId('collection-pack-details-size')).toBeNull();
    const description = screen.getByTestId('collection-pack-details-description');
    expect(description).toHaveTextContent('Festive sets this week.');
    expect(description.textContent).not.toMatch(/Description/);
    expect(screen.getByTestId('collection-pack-details-item-tags')).toHaveTextContent('Item tags');
    expect(screen.getByTestId('collection-pack-details-item-tags')).toHaveTextContent('Kurti');
    expect(screen.getByTestId('collection-pack-details-quality-tags')).toHaveTextContent(
      'Embroidered',
    );
  });

  it('shows Size when a size tag is set', () => {
    render(
      <CollectionPackDetails categories={['S']} description={null} rateBand={null} />,
    );
    expect(screen.getByTestId('collection-pack-details-size')).toHaveTextContent('S');
    expect(screen.queryByTestId('collection-pack-details-rate')).toBeNull();
  });

  it('toggles read more when content overflows', async () => {
    const user = userEvent.setup();
    vi.spyOn(chrome, 'noteBlockOverflows').mockReturnValue(true);
    render(
      <CollectionPackDetails
        categories={['Kurti']}
        description={'Line one.\nLine two.\nLine three.\nLine four.'}
        rateBand="₹900 /pc"
      />,
    );
    const more = screen.getByTestId('collection-pack-details-more');
    expect(more).toHaveTextContent('read more');
    // On the last clamped line — not a new row under the block (BM-11).
    expect(more.className).toMatch(/absolute/);
    await user.click(more);
    expect(more).toHaveTextContent('Show less');
    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(more.className).not.toMatch(/absolute/);
  });

  it('collapses on whole line boxes — never mid-glyph max-height (BM-07)', () => {
    vi.spyOn(chrome, 'noteBlockOverflows').mockReturnValue(true);
    const { container } = render(
      <CollectionPackDetails
        categories={[]}
        description={'Line one.\nLine two.\nLine three.\nLine four.'}
        rateBand={null}
      />,
    );
    const body = container.querySelector('[data-testid="collection-pack-details"] > div');
    expect(body?.className).toMatch(/max-h-\[3\.75rem\]/);
    expect(body?.className).not.toMatch(/max-h-\[4\.5rem\]/);
  });

  it('renders nothing when every section is empty', () => {
    const { container } = render(
      <CollectionPackDetails categories={[]} description="" rateBand={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
