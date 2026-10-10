import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('shows Designs · Photos · Replace on one idle row', () => {
    render(
      <OwnerPackManageDock
        selecting={false}
        canDelete={false}
        canRemove={false}
        onAddDesigns={vi.fn()}
        onAddPhotos={vi.fn()}
        onReplace={vi.fn()}
        onDelete={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const designs = screen.getByTestId('owner-pack-add-designs');
    const photos = screen.getByTestId('owner-pack-add-photos');
    const replace = screen.getByTestId('owner-pack-replace');
    expect(designs).toHaveTextContent('Designs');
    expect(photos).toHaveTextContent('Photos');
    expect(replace).toHaveTextContent('Replace');
    expect(designs.compareDocumentPosition(photos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(photos.compareDocumentPosition(replace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
