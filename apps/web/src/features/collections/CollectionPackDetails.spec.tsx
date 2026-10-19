import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { CollectionPackDetails } from './CollectionPackDetails';

afterEach(() => cleanup());

describe('CollectionPackDetails', () => {
  it('puts every tag then the price on one line', () => {
    render(
      <CollectionPackDetails
        categories={['Kurti', 'Embroidered', 'S']}
        description="Festive sets this week."
        rateBand="₹1,200 /pc"
      />,
    );
    expect(screen.getByTestId('collection-pack-facts')).toHaveTextContent(
      "Kurti · Embroidered · S · ₹1,200 /pc",
    );
    expect(screen.queryByText('Item tags')).toBeNull();
    expect(screen.queryByText('Size tags')).toBeNull();
    expect(screen.queryByText('Quality tags')).toBeNull();
    expect(screen.queryByTestId('collection-pack-details-description')).toBeNull();
  });

  it('shows the journey line under the facts', () => {
    render(
      <CollectionPackDetails
        categories={['Unstitched']}
        description={null}
        rateBand="₹430 – ₹1,450 / pc"
        journeyLine="Rates are per pc. Order and dispatch per set."
      />,
    );
    expect(screen.getByTestId('collection-pack-facts')).toHaveTextContent(
      'Unstitched · ₹430 – ₹1,450 / pc',
    );
    expect(screen.getByTestId('collection-pack-journey')).toHaveTextContent(
      'Rates are per pc. Order and dispatch per set.',
    );
  });

  it('keeps the description behind About this collection', async () => {
    const user = userEvent.setup();
    render(
      <CollectionPackDetails
        categories={[]}
        description="Festive sets this week."
        rateBand={null}
      />,
    );
    const about = screen.getByTestId('collection-about');
    expect(about).toHaveTextContent('About this collection');
    expect(about).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('collection-pack-details-description')).toBeNull();
    await user.click(about);
    expect(about).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('collection-pack-details-description')).toHaveTextContent(
      'Festive sets this week.',
    );
  });

  it('omits About when there is no description', () => {
    render(
      <CollectionPackDetails categories={['S', 'M']} description={null} rateBand={null} />,
    );
    expect(screen.getByTestId('collection-pack-facts')).toHaveTextContent('S · M');
    expect(screen.queryByTestId('collection-about')).toBeNull();
  });

  it('renders nothing when every section is empty', () => {
    const { container } = render(
      <CollectionPackDetails categories={[]} description="" rateBand={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
