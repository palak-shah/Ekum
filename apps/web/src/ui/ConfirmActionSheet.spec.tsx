import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmActionSheet } from './ConfirmActionSheet';

describe('ConfirmActionSheet', () => {
  it('Cancel and confirm match DiscardChangesSheet order', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmActionSheet
        open
        title="Leave this chat?"
        body="Off your inbox. Others stay."
        confirmLabel="Leave"
        testId="thread-leave-confirm"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Leave this chat?' })).toBeInTheDocument();
    expect(screen.getByText('Off your inbox. Others stay.')).toBeInTheDocument();
    const footer = screen.getByTestId('thread-leave-confirm');
    expect(footer.querySelectorAll('button')[0]).toHaveTextContent('Cancel');
    expect(footer.querySelectorAll('button')[1]).toHaveTextContent('Leave');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Leave' }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
