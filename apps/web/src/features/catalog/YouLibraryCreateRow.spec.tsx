import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { YouLibraryCreateRow } from './YouLibraryCreateRow';

afterEach(() => {
  cleanup();
});

describe('YouLibraryCreateRow', () => {
  it('uses a 48px dashed thumb, not a 64px album tile', () => {
    render(<YouLibraryCreateRow testId="you-new-design" label="New design" onClick={() => undefined} />);
    const row = screen.getByTestId('you-new-design');
    expect(row).toHaveTextContent('New design');
    expect(row.querySelector('.h-12.w-12')).toBeTruthy();
    expect(row.querySelector('.h-16.w-16')).toBeNull();
  });

  it('stays on screen and does not fire while disabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <YouLibraryCreateRow
        testId="you-new-collection"
        label="New collection"
        disabled
        onClick={onClick}
      />,
    );
    const row = screen.getByTestId('you-new-collection');
    expect(row).toBeDisabled();
    await user.click(row);
    expect(onClick).not.toHaveBeenCalled();
  });
});
