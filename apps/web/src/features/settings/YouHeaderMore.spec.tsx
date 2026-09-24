import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { YouHeaderMore } from './YouHeaderMore';

const logout = vi.fn(() => Promise.resolve());

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ logout }),
}));

describe('YouHeaderMore', () => {
  it('keeps Network, Settings, and Log out behind shell ⋯', async () => {
    const user = userEvent.setup();
    logout.mockClear();
    render(
      <MemoryRouter>
        <YouHeaderMore />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('menuitem', { name: 'Settings' })).toBeNull();
    await user.click(screen.getByTestId('you-more'));
    expect(screen.getByTestId('you-more-menu')).toHaveAttribute('role', 'menu');
    expect(screen.getByTestId('you-more-network')).toBeInTheDocument();
    expect(screen.getByTestId('you-more-settings')).toBeInTheDocument();
    expect(screen.getByTestId('you-more-logout')).toBeInTheDocument();
    await user.click(screen.getByTestId('you-more-logout'));
    expect(logout).toHaveBeenCalled();
  });
});
