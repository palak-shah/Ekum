import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OwnerCollectionMoreSheet } from './OwnerCollectionMoreSheet';

describe('OwnerCollectionMoreSheet', () => {
  it('lists Share · Who · manage trio · Edit with the collection title', async () => {
    const user = userEvent.setup();
    const onShare = vi.fn();
    const onWho = vi.fn();
    const onAddDesigns = vi.fn();
    const onAddPhotos = vi.fn();
    const onReplace = vi.fn();
    const onEdit = vi.fn();
    const onClose = vi.fn();
    render(
      <OwnerCollectionMoreSheet
        open
        title="Monsoon Cottons"
        onClose={onClose}
        onShare={onShare}
        onWhoHasAccess={onWho}
        onAddDesigns={onAddDesigns}
        onAddPhotos={onAddPhotos}
        onReplace={onReplace}
        onEditDetails={onEdit}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Monsoon Cottons' })).toBeInTheDocument();
    expect(screen.getByTestId('collection-menu-share')).toHaveTextContent('Share this collection');
    expect(screen.getByTestId('collection-menu-who')).toHaveTextContent('Who has access');
    expect(screen.getByTestId('collection-menu-add-designs')).toHaveTextContent(
      'Add from existing designs',
    );
    expect(screen.getByTestId('collection-menu-add-photos')).toHaveTextContent('Add photos');
    expect(screen.getByTestId('collection-menu-replace')).toHaveTextContent(
      'Replace entire collection',
    );
    expect(screen.getByTestId('collection-menu-edit')).toHaveTextContent('Edit collection details');

    await user.click(screen.getByTestId('collection-menu-add-designs'));
    expect(onClose).toHaveBeenCalled();
    expect(onAddDesigns).toHaveBeenCalled();

    onClose.mockClear();
    await user.click(screen.getByTestId('collection-menu-replace'));
    expect(onClose).toHaveBeenCalled();
    expect(onReplace).toHaveBeenCalled();
  });
});
