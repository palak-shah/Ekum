import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OwnerPackReplaceSheet } from './OwnerPackReplaceSheet';

describe('OwnerPackReplaceSheet', () => {
  it('asks Designs or Photos in the sheet — not a bare confirm', async () => {
    const user = userEvent.setup();
    const onDesigns = vi.fn();
    const onPhotos = vi.fn();
    render(
      <OwnerPackReplaceSheet
        open
        onClose={vi.fn()}
        onDesigns={onDesigns}
        onPhotos={onPhotos}
      />,
    );
    const copy = screen.getByTestId('owner-pack-replace-copy');
    expect(copy).toHaveTextContent(/updates only after you save/i);
    expect(copy).not.toHaveTextContent(/Clears this collection/i);
    expect(screen.getByTestId('collection-add-doors')).toBeInTheDocument();
    expect(screen.queryByTestId('owner-pack-replace-confirm')).toBeNull();

    await user.click(screen.getByTestId('collection-add-designs'));
    expect(onDesigns).toHaveBeenCalledTimes(1);
    await user.click(screen.getByTestId('collection-add-photos'));
    expect(onPhotos).toHaveBeenCalledTimes(1);
  });
});
