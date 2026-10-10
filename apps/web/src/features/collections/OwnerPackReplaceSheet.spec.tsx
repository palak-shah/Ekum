import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OwnerPackReplaceSheet } from './OwnerPackReplaceSheet';

describe('OwnerPackReplaceSheet', () => {
  it('says the collection updates only after a new set is saved', () => {
    render(
      <OwnerPackReplaceSheet open onClose={vi.fn()} onConfirm={vi.fn()} />,
    );
    const copy = screen.getByTestId('owner-pack-replace-copy');
    expect(copy).toHaveTextContent(/updates only after you save/i);
    expect(copy).not.toHaveTextContent(/Clears this collection/i);
  });
});
