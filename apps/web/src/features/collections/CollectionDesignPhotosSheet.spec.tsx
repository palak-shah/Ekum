import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { collectionDesignSheetMoreIds } from '@/features/collections/collectionDesignSheetMore';
import { MoreActionsSheet } from '@/ui/MoreActionsSheet';
import { PencilIcon, TrashIcon } from '@/ui/icons';

function renderOwnerDesignMore(opts: { canEdit: boolean; canDelete: boolean }) {
  const onEdit = vi.fn();
  const onRemove = vi.fn();
  const onDelete = vi.fn();
  const items = collectionDesignSheetMoreIds(opts).flatMap((id) => {
    if (id === 'edit') {
      return [
        {
          id: 'edit',
          label: 'Edit design',
          icon: <PencilIcon width={20} height={20} />,
          onClick: onEdit,
          testId: 'collection-design-edit',
        },
      ];
    }
    if (id === 'delete') {
      return [
        {
          id: 'delete',
          label: 'Delete design',
          icon: <TrashIcon width={20} height={20} />,
          danger: true as const,
          onClick: onDelete,
          testId: 'collection-design-delete',
        },
      ];
    }
    return [
      {
        id: 'remove',
        label: 'Remove from this collection',
        icon: <TrashIcon width={20} height={20} />,
        onClick: onRemove,
        testId: 'collection-design-remove',
      },
    ];
  });
  render(
    <MoreActionsSheet
      open
      onClose={() => undefined}
      title="Navy"
      testId="collection-design-more-sheet"
      items={items}
    />,
  );
  return { onEdit, onRemove, onDelete };
}

describe('collection design sheet ⋯', () => {
  it('lists Edit · Remove · Delete; Delete last', async () => {
    const user = userEvent.setup();
    const { onEdit, onRemove, onDelete } = renderOwnerDesignMore({
      canEdit: true,
      canDelete: true,
    });
    expect(screen.getByTestId('collection-design-edit')).toHaveTextContent('Edit design');
    expect(screen.getByTestId('collection-design-remove')).toHaveTextContent(
      'Remove from this collection',
    );
    expect(screen.getByTestId('collection-design-delete')).toHaveTextContent('Delete design');
    await user.click(screen.getByTestId('collection-design-edit'));
    expect(onEdit).toHaveBeenCalled();
    await user.click(screen.getByTestId('collection-design-remove'));
    expect(onRemove).toHaveBeenCalled();
    await user.click(screen.getByTestId('collection-design-delete'));
    expect(onDelete).toHaveBeenCalled();
  });

  it('curated mill: Remove only', () => {
    renderOwnerDesignMore({ canEdit: false, canDelete: false });
    expect(screen.queryByTestId('collection-design-edit')).toBeNull();
    expect(screen.queryByTestId('collection-design-delete')).toBeNull();
    expect(screen.getByTestId('collection-design-remove')).toBeInTheDocument();
  });
});
