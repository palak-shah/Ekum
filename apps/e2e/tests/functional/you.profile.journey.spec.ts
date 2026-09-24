import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('You profile @functional @settings', () => {
  test('You has Edit, Share, and library; Settings has Team and Your paths', async ({
    page,
  }) => {
    await loginAsRavi(page);
    await page.goto('/more');
    await expect(page.getByRole('heading', { name: 'You' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('you-more')).toBeVisible();
    await expect(page.getByTestId('page-header-back')).toHaveCount(0);
    await expect(page.getByTestId('you-edit')).toBeVisible();
    await expect(page.getByTestId('you-share')).toBeVisible();
    await expect(page.getByTestId('you-tab-designs')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Archived' })).toBeVisible();
    await expect(page.getByTestId('you-tab-saved')).toBeVisible();
    await expect(page.getByTestId('you-library-search')).toHaveCount(0);
    await page.getByTestId('you-library-search-toggle').click();
    await expect(page.getByTestId('you-library-search')).toBeVisible();
    await page.getByRole('button', { name: 'Published' }).click();
    await page.getByTestId('you-library-search').fill('Banarasi');
    await expect(page.getByText('Banarasi Silk Saree').first()).toBeVisible();
    await page.getByTestId('you-library-search').fill('zzzz-no-match');
    await expect(page.getByText('No designs match')).toBeVisible();
    await page.getByTestId('you-library-search').fill('');

    await page.getByTestId('you-edit').click();
    await expect(page.getByRole('heading', { name: /Business profile/i })).toBeVisible({
      timeout: 10_000,
    });

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
