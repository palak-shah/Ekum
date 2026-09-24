import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SettingsDomainCard, SettingsDomainGroup } from './SettingsDomainCard';

describe('SettingsDomainCard', () => {
  it('is a compact link with title, hint, and chevron target', () => {
    render(
      <MemoryRouter>
        <SettingsDomainGroup title="Business & Roles" testId="settings-domain-business-roles">
          <SettingsDomainCard to="/team" title="Team" hint="People on this shop" />
        </SettingsDomainGroup>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('settings-domain-business-roles')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Team/ })).toHaveAttribute('href', '/team');
    expect(screen.getByText('People on this shop')).toBeInTheDocument();
  });
});
