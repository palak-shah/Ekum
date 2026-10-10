import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoreActionsSheet } from './MoreActionsSheet';

describe('MoreActionsSheet', () => {
  it('renders icon+text rows in a bottom sheet', async () => {
    const user = userEvent.setup();
    const onShare = vi.fn();
    render(
      <MoreActionsSheet
        open
        title="Monsoon Cottons"
        onClose={vi.fn()}
        items={[
          {
            id: 'share',
            label: 'Share this collection',
            icon: <span data-testid="icon-share" />,
            onClick: onShare,
            testId: 'row-share',
          },
          {
            id: 'delete',
            label: 'Delete',
            icon: <span />,
            onClick: vi.fn(),
            danger: true,
            testId: 'row-delete',
          },
        ]}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Monsoon Cottons' })).toBeInTheDocument();
    expect(screen.getByTestId('row-share')).toHaveTextContent('Share this collection');
    expect(screen.getByTestId('icon-share')).toBeInTheDocument();
    expect(screen.getByTestId('row-delete')).toHaveClass('text-danger');
    await user.click(screen.getByTestId('row-share'));
    expect(onShare).toHaveBeenCalled();
  });
});
