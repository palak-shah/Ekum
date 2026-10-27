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

  it('opens the description from more... on the facts line', async () => {
    const user = userEvent.setup();
    render(
      <CollectionPackDetails
        categories={['Fabric']}
        description="Festive sets this week."
        rateBand="₹85–₹160 /mtr"
      />,
    );
    const about = screen.getByTestId('collection-about');
    expect(about).toHaveTextContent('more...');
    expect(about.className).toMatch(/text-muted/);
    expect(screen.queryByText('About this collection')).toBeNull();
    expect(about).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('collection-pack-details-description')).toBeNull();
    await user.click(about);
    expect(about).toHaveTextContent('less');
    expect(about).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('collection-pack-details-description')).toHaveTextContent(
      'Festive sets this week.',
    );
  });

  it('omits more... when there is no description', () => {
    render(
      <CollectionPackDetails categories={['S', 'M']} description={null} rateBand={null} />,
    );
    expect(screen.getByTestId('collection-pack-facts')).toHaveTextContent('S · M');
    expect(screen.queryByTestId('collection-about')).toBeNull();
  });

  it('omits the pack journey when the album is leftover storage', () => {
    render(
      <CollectionPackDetails
        categories={[]}
        description={null}
        rateBand="₹91 /pc"
        journeyLine={null}
      />,
    );
    expect(screen.getByTestId('collection-pack-facts')).toHaveTextContent('₹91 /pc');
    expect(screen.queryByTestId('collection-pack-journey')).toBeNull();
  });

  it('renders nothing when every section is empty', () => {
    const { container } = render(
      <CollectionPackDetails categories={[]} description="" rateBand={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
