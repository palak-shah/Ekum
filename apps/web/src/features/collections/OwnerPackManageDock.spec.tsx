import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OwnerPackManageDock } from './OwnerPackManageDock';

describe('OwnerPackManageDock', () => {
  it('shows only Update on the editor dock', () => {
    render(
      <OwnerPackManageDock
        selecting={false}
        canDelete={false}
        canRemove={false}
        onDelete={vi.fn()}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );
    expect(screen.getByTestId('collection-editor-update')).toHaveTextContent('Update collection');
    expect(screen.queryByTestId('owner-pack-add-designs')).toBeNull();
    expect(screen.queryByTestId('owner-pack-add-photos')).toBeNull();
    expect(screen.queryByTestId('owner-pack-replace')).toBeNull();
  });

  it('shows the shared Button loader while Update is in flight', () => {
    render(
      <OwnerPackManageDock
        selecting={false}
        canDelete={false}
        canRemove={false}
        onDelete={vi.fn()}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
        updatePending
      />,
    );
    const button = screen.getByTestId('collection-editor-update');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('.animate-spin')).toBeTruthy();
    expect(button).toHaveTextContent('Update collection');
  });

  it('opens Designs · Photos · Replace from Update collection', async () => {
    const user = userEvent.setup();
    const onAddDesigns = vi.fn();
    render(
      <OwnerPackManageDock
        selecting={false}
        canDelete={false}
        canRemove={false}
        onAddDesigns={onAddDesigns}
        onAddPhotos={vi.fn()}
        onReplace={vi.fn()}
        onDelete={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('owner-pack-add-designs')).toBeNull();
    await user.click(screen.getByTestId('owner-pack-update'));
    const designs = screen.getByTestId('owner-pack-add-designs');
    const photos = screen.getByTestId('owner-pack-add-photos');
    const replace = screen.getByTestId('owner-pack-replace');
    expect(designs).toHaveTextContent('Add designs');
    expect(photos).toHaveTextContent('Add photos');
    expect(replace).toHaveTextContent('Replace entire collection');
    expect(designs.compareDocumentPosition(photos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(photos.compareDocumentPosition(replace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await user.click(designs);
    expect(onAddDesigns).toHaveBeenCalled();
  });

  it('shows Cart · Share · Delete icons then Remove when selecting', () => {
    render(
      <OwnerPackManageDock
        selecting
        canAddToCart
        canShare
        canDelete
        canRemove
        onAddDesigns={vi.fn()}
        onAddPhotos={vi.fn()}
        onReplace={vi.fn()}
        onAddToCart={vi.fn()}
        onShare={vi.fn()}
        onDelete={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const cartBtn = screen.getByTestId('owner-pack-cart');
    const shareBtn = screen.getByTestId('owner-pack-share');
    const deleteBtn = screen.getByTestId('owner-pack-delete');
    const removeBtn = screen.getByTestId('owner-pack-remove');
    expect(cartBtn).toHaveAttribute('aria-label', 'Add to cart');
    expect(shareBtn).toHaveAttribute('aria-label', 'Share');
    expect(deleteBtn).toHaveAttribute('aria-label', 'Delete');
    expect(deleteBtn).not.toHaveTextContent('Delete');
    expect(removeBtn).toHaveTextContent('Remove from this collection');
    expect(removeBtn.className).toMatch(/bg-accent/);
    expect(cartBtn.compareDocumentPosition(shareBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(shareBtn.compareDocumentPosition(deleteBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(deleteBtn.compareDocumentPosition(removeBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows Delete for mill designs curated into this pack', () => {
    render(
      <OwnerPackManageDock
        selecting
        canAddToCart
        canShare
        canDelete
        canRemove
        onAddDesigns={vi.fn()}
        onAddPhotos={vi.fn()}
        onReplace={vi.fn()}
        onAddToCart={vi.fn()}
        onShare={vi.fn()}
        onDelete={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByTestId('owner-pack-cart')).toBeEnabled();
    expect(screen.getByTestId('owner-pack-share')).toBeEnabled();
    expect(screen.getByTestId('owner-pack-delete')).toBeEnabled();
    expect(screen.getByTestId('owner-pack-remove')).toBeEnabled();
  });
});
