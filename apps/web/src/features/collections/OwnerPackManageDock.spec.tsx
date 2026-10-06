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
        onAdd={vi.fn()}
        onReplace={vi.fn()}
        onDelete={vi.fn()}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );
    expect(screen.getByTestId('collection-editor-update')).toHaveTextContent('Update collection');
    expect(screen.queryByTestId('owner-pack-add')).toBeNull();
    expect(screen.queryByTestId('owner-pack-replace')).toBeNull();
  });

  it('shows Add and Replace when idle', () => {
    render(
      <OwnerPackManageDock
        selecting={false}
        canDelete={false}
        canRemove={false}
        onAdd={vi.fn()}
        onReplace={vi.fn()}
        onDelete={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByTestId('owner-pack-add')).toHaveTextContent('Add designs');
    expect(screen.getByTestId('owner-pack-replace')).toHaveTextContent(
      'Replace whole collection',
    );
  });

  it('shows Delete then Remove from this collection when selecting', () => {
    render(
      <OwnerPackManageDock
        selecting
        canDelete
        canRemove
        onAdd={vi.fn()}
        onReplace={vi.fn()}
        onDelete={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const deleteBtn = screen.getByTestId('owner-pack-delete');
    const removeBtn = screen.getByTestId('owner-pack-remove');
    expect(deleteBtn).toHaveTextContent('Delete');
    expect(removeBtn).toHaveTextContent('Remove from this collection');
    expect(deleteBtn.compareDocumentPosition(removeBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows Delete for mill designs curated into this pack', () => {
    render(
      <OwnerPackManageDock
        selecting
        canDelete
        canRemove
        onAdd={vi.fn()}
        onReplace={vi.fn()}
        onDelete={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByTestId('owner-pack-delete')).toBeEnabled();
    expect(screen.getByTestId('owner-pack-remove')).toBeEnabled();
  });
});
