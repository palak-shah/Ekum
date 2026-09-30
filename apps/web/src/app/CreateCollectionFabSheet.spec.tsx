import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateCollectionFabSheet } from './CreateCollectionFabSheet';
import {
  CREATE_FAB_MY_COLLECTIONS_HREF,
  CREATE_FAB_NEW_COLLECTION_HREF,
} from './createFabIntent';

describe('CreateCollectionFabSheet', () => {
  it('sends Create to New collection and Update to You Collections', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    const onClose = vi.fn();
    const { rerender } = render(
      <CreateCollectionFabSheet open onClose={onClose} onPick={onPick} />,
    );

    await user.click(screen.getByTestId('create-fab-new-collection'));
    expect(onClose).toHaveBeenCalled();
    expect(onPick).toHaveBeenCalledWith(CREATE_FAB_NEW_COLLECTION_HREF);

    onPick.mockClear();
    onClose.mockClear();
    rerender(<CreateCollectionFabSheet open onClose={onClose} onPick={onPick} />);
    await user.click(screen.getByTestId('create-fab-update-collection'));
    expect(onPick).toHaveBeenCalledWith(CREATE_FAB_MY_COLLECTIONS_HREF);
  });
});
