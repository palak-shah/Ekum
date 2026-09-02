import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ThreadPeopleSheet } from './ThreadPeopleSheet';

describe('ThreadPeopleSheet', () => {
  it('toggles staff on and off with highlighted rows', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onRemove = vi.fn();

    render(
      <ThreadPeopleSheet
        open
        onClose={() => {}}
        people={[
          { userId: 'u-owner', name: 'Ravi', role: 'owner', state: 'active' },
          { userId: 'u-1', name: 'Pushya', role: 'staff', state: 'active' },
        ]}
        team={[
          { userId: 'u-owner', name: 'Ravi', role: 'owner' },
          { userId: 'u-1', name: 'Pushya', role: 'staff' },
          { userId: 'u-2', name: 'Amit', role: 'staff' },
        ]}
        busy={false}
        onAdd={onAdd}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Team on chat' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Search your team')).toBeNull();
    expect(screen.getByText('Pushya').closest('button')).toHaveClass('border-accent');
    expect(screen.getByText('Amit').closest('button')).not.toHaveClass('border-accent');

    await user.click(screen.getByText('Pushya'));
    expect(onRemove).toHaveBeenCalledWith('u-1');

    await user.click(screen.getByText('Amit'));
    expect(onAdd).toHaveBeenCalledWith('u-2');

    const rows = screen.getAllByText(/Ravi|Pushya|Amit/);
    expect(rows[rows.length - 1]).toHaveTextContent('Ravi');
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('shows Open chat in the footer when roster matches another group', () => {
    const onOpenExisting = vi.fn();

    render(
      <ThreadPeopleSheet
        open
        onClose={() => {}}
        people={[{ userId: 'u-owner', name: 'Ravi', role: 'owner', state: 'active' }]}
        team={[
          { userId: 'u-owner', name: 'Ravi', role: 'owner' },
          { userId: 'u-2', name: 'Amit', role: 'staff' },
        ]}
        busy={false}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        existingChat={{ threadId: 'thread-existing', title: 'Jaipur and Darshit' }}
        onOpenExisting={onOpenExisting}
      />,
    );

    expect(screen.getByText('Same as Jaipur and Darshit.')).toBeInTheDocument();
    expect(screen.queryByText(/Open that chat/)).toBeNull();
    screen.getByRole('button', { name: 'Open chat' }).click();
    expect(onOpenExisting).toHaveBeenCalledWith('thread-existing');
  });
});
