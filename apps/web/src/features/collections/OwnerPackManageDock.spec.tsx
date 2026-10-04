import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OwnerPackManageDock } from './OwnerPackManageDock';

describe('OwnerPackManageDock', () => {
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
    expect(screen.getByTestId('owner-pack-add')).toHaveTextContent('Add new designs');
    expect(screen.getByTestId('owner-pack-replace')).toHaveTextContent(
      'Replace whole collection',
    );
  });

  it('shows Remove then Delete when selecting', () => {
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
    expect(screen.getByTestId('owner-pack-remove')).toHaveTextContent(
      'Remove from collection',
    );
    expect(screen.getByTestId('owner-pack-delete')).toHaveTextContent('Delete');
  });
});
