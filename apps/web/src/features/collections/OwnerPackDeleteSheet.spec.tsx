import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OwnerPackDeleteSheet } from './OwnerPackDeleteSheet';

describe('OwnerPackDeleteSheet', () => {
  it('offers delete everywhere vs only this collection', async () => {
    const user = userEvent.setup();
    const everywhere = vi.fn();
    const onlyHere = vi.fn();
    render(
      <OwnerPackDeleteSheet
        open
        onClose={vi.fn()}
        onDeleteEverywhere={everywhere}
        onOnlyThisCollection={onlyHere}
      />,
    );
    expect(screen.getByTestId('owner-pack-delete-sheet')).toBeInTheDocument();
    await user.click(screen.getByTestId('owner-pack-delete-everywhere'));
    expect(everywhere).toHaveBeenCalled();
    await user.click(screen.getByTestId('owner-pack-delete-only-here'));
    expect(onlyHere).toHaveBeenCalled();
  });
});
