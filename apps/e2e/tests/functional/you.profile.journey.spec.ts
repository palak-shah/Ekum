import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('You profile @functional @settings', () => {
  test('You has library; Home avatar opens Profile with Share', async ({
    page,
  }) => {
    await loginAsRavi(page);
    await page.goto('/more');
    await expect(page.getByRole('heading', { name: 'You' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('you-more')).toHaveCount(0);
    await expect(page.getByTestId('page-header-back')).toHaveCount(0);
    await expect(page.getByTestId('you-edit')).toHaveCount(0);
    await expect(page.getByText('Edit profile')).toHaveCount(0);
    await expect(page.getByTestId('you-share')).toHaveCount(0);
    await expect(page.getByTestId('you-tab-designs')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Collections' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('tab', { name: 'Designs' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Published' })).toHaveCount(0);
    await expect(page.getByTestId('you-library-status-filters')).toHaveCount(0);
    await expect(page.getByTestId('you-tab-saved')).toHaveCount(0);
    await expect(page.getByTestId('you-library-search')).toHaveCount(0);
    await page.getByTestId('you-library-search-toggle').click();
    await expect(page.getByTestId('you-library-search')).toBeVisible();
    await expect(page.getByTestId('you-library-filter')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Draft' })).toHaveCount(0);
    await page.getByTestId('you-library-filter').click();
    await expect(page.getByTestId('you-library-filter-draft')).toBeVisible();
    await expect(page.getByTestId('you-library-filter-archived')).toBeVisible();
    await expect(page.getByTestId('you-library-filter-saved')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Published' })).toHaveCount(0);
    await page.getByTestId('you-library-filter').click();
    await page.getByTestId('you-tab-designs').click();
    await page.getByTestId('you-library-search').fill('Banarasi');
    await expect(page.getByText('Banarasi Silk Saree').first()).toBeVisible();
    await page.getByTestId('you-library-search').fill('zzzz-no-match');
    await expect(page.getByText('No designs match')).toBeVisible();
    await page.getByTestId('you-library-search').fill('');

    await page.goto('/');
    await page.getByTestId('home-account').click();
    await page.getByTestId('home-account-profile').click();
    await expect(page.getByRole('heading', { name: /Business profile/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('profile-edit')).toBeVisible();
    await expect(page.getByTestId('you-share')).toHaveAttribute('aria-label', 'Share');
    await expect(page.getByTestId('profile-update')).toHaveCount(0);
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await expect(page.getByTestId('app-bottom-nav')).toBeVisible();
    await page.getByTestId('profile-edit').click();
    await expect(page).toHaveURL(/\/settings\/profile\?edit=1/);
    await expect(page.getByTestId('profile-update')).toBeVisible();
    await expect(page.getByTestId('you-share')).toHaveCount(0);
    await expect(page.getByTestId('app-bottom-nav')).toBeHidden();
    await page.getByTestId('page-header-back').click();
    await expect(page.getByTestId('profile-edit')).toBeVisible();
    await expect(page.getByTestId('app-bottom-nav')).toBeVisible();
    await expect(page.getByText('Trade on Ekum')).toHaveCount(0);
    await expect(page.getByText('I buy on Ekum')).toHaveCount(0);
    await expect(page.getByText('I sell on Ekum')).toHaveCount(0);
    await expect(page.getByText('I trade on Ekum')).toHaveCount(0);

    await page.goto('/catalog?tab=products');
    await expect(page).toHaveURL(/\/more/);
    await expect(page.getByTestId('you-tab-designs')).toBeVisible({ timeout: 15_000 });

    await page.goto('/settings');
    await expect(page.getByTestId('settings-domain-business-roles')).toBeVisible();
    await expect(page.getByTestId('settings-domain-dispatch')).toBeVisible();
    await expect(page.getByTestId('settings-domain-billing')).toBeVisible();
    await expect(page.getByRole('link', { name: /^Team/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Your paths/i })).toBeVisible();
    await page.getByRole('link', { name: /^Team/ }).click();
    await expect(page.getByRole('main').getByRole('heading', { name: 'Team' })).toBeVisible({
      timeout: 10_000,
    });
  });
});
