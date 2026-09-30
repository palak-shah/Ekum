import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { HomeAccountMenu } from './HomeAccountMenu';

const logout = vi.fn(() => Promise.resolve());

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ logout }),
}));

describe('HomeAccountMenu', () => {
  it('opens Profile through Log out from the Home avatar', async () => {
    const user = userEvent.setup();
    logout.mockClear();
    render(
      <MemoryRouter>
        <HomeAccountMenu name="Surat Silk House" />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('menuitem', { name: 'Settings' })).toBeNull();
    await user.click(screen.getByTestId('home-account'));
    expect(screen.getByTestId('home-account-menu')).toHaveClass('w-64');
    expect(screen.getByTestId('home-account-profile')).toHaveTextContent('Profile');
    expect(screen.getByTestId('home-account-network')).toBeInTheDocument();
    expect(screen.getByTestId('home-account-my-collections')).toHaveTextContent('My Collections');
    expect(screen.getByTestId('home-account-my-designs')).toHaveTextContent('My Designs');
    expect(screen.getByTestId('home-account-settings')).toBeInTheDocument();
    expect(screen.getByTestId('home-account-logout')).toHaveClass('text-danger');
    await user.click(screen.getByTestId('home-account-logout'));
    expect(logout).toHaveBeenCalled();
  });
});
