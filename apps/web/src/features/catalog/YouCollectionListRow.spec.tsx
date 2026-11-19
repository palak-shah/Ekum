import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CollectionKind, CollectionStatus } from '@ekum/domain-types';
import { describe, expect, it, vi } from 'vitest';
import { YouCollectionListRow } from './YouCollectionListRow';

function renderRow(kind?: string) {
  return render(
    <MemoryRouter>
      <YouCollectionListRow
        collection={{
          id: 'col-1',
          name: 'Season book',
          status: CollectionStatus.Published,
          kind,
          coverImage: null,
        }}
        selecting={false}
        selected={false}
        swipeOpen={false}
        onSwipeOpen={vi.fn()}
        onSwipeClose={vi.fn()}
        onToggle={vi.fn()}
        onLongSelect={vi.fn()}
        onMore={vi.fn()}
        onShare={vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe('YouCollectionListRow catalog chip', () => {
  it('shows Catalog badge on catalog rows', () => {
    renderRow(CollectionKind.Catalog);
    expect(screen.getByTestId('you-collection-catalog-chip')).toHaveTextContent('Catalog');
  });

  it('omits Catalog badge on regular collections', () => {
    renderRow(CollectionKind.Regular);
    expect(screen.queryByTestId('you-collection-catalog-chip')).toBeNull();
  });
});
