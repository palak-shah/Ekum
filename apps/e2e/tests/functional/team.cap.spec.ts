import { test, expect } from '@playwright/test';
import { loginAsAmit, loginAsKavita } from '../../helpers/persona';

test.describe('team caps @functional @team', () => {
  test('staff without uploads cap does not see Add designs in ＋ menu', async ({ page }) => {
    await loginAsAmit(page);
    await page.goto('/');
    await expect(page.getByText(/Namaste/i)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('button', { name: 'Add designs' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'New collection' })).toHaveCount(0);
  });
});

test.describe('trader persona @functional @trader', () => {
  test('Kavita can browse Explore trade sides', async ({ page }) => {
    await loginAsKavita(page);
    await page.goto('/explore');

    await page.getByTestId('explore-filter').click();
    await expect(page.getByTestId('explore-filter-menu')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('explore-trade-switch')).toHaveText('Explore Buyers');

    await page.getByTestId('explore-trade-switch').click();

    await page.getByTestId('explore-filter').click();
    await expect(page.getByTestId('explore-trade-switch')).toHaveText('Explore Suppliers');
  });
});
