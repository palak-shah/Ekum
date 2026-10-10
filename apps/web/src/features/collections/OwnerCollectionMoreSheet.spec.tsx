import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OwnerCollectionMoreSheet } from './OwnerCollectionMoreSheet';

describe('OwnerCollectionMoreSheet', () => {
  it('lists Share · Who · Add photos · Edit with the collection title', async () => {
    const user = userEvent.setup();
    const onShare = vi.fn();
    const onWho = vi.fn();
    const onAdd = vi.fn();
    const onEdit = vi.fn();
    const onClose = vi.fn();
    render(
      <OwnerCollectionMoreSheet
        open
        title="Monsoon Cottons"
        onClose={onClose}
        onShare={onShare}
        onWhoHasAccess={onWho}
        onAddPhotos={onAdd}
        onEditDetails={onEdit}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Monsoon Cottons' })).toBeInTheDocument();
    expect(screen.getByTestId('collection-menu-share')).toHaveTextContent('Share this collection');
    expect(screen.getByTestId('collection-menu-who')).toHaveTextContent('Who has access');
    expect(screen.getByTestId('collection-menu-add-photos')).toHaveTextContent('Add photos');
    expect(screen.getByTestId('collection-menu-edit')).toHaveTextContent('Edit collection details');

    await user.click(screen.getByTestId('collection-menu-share'));
    expect(onClose).toHaveBeenCalled();
    expect(onShare).toHaveBeenCalled();
  });
});
