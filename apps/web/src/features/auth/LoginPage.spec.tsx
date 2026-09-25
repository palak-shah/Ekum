import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ login: vi.fn() }),
}));

describe('LoginPage phone field', () => {
  it('accepts a typed mobile number and keeps Continue gated at 10 characters', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const field = screen.getByLabelText('Mobile number');
    expect(field).toHaveAttribute('type', 'tel');
    expect(field).toHaveAttribute('inputMode', 'tel');
    expect(field).not.toHaveAttribute('readonly');
    expect(field).not.toHaveFocus();

    await user.type(field, '+919800000001');
    expect(field).toHaveValue('+919800000001');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });
});
