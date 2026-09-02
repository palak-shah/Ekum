import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('orders chrome @functional @orders', () => {
  test('filter menu selects type and dismisses on Escape', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/orders');

    await page.getByTestId('orders-filter').click();
    await expect(page.getByTestId('orders-filter-menu')).toBeVisible();

    await page.getByTestId('orders-filter-open-type').click();
    await page.getByTestId('orders-filter-type-sample').click();

    await expect(page).toHaveURL(/kind=sample/, { timeout: 10_000 });
    await expect(page.getByText(/Sample/i).first()).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('orders-filter-menu')).toHaveCount(0);
  });

  test('Samples shortcut redirects to filtered orders list', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/samples');
    await expect(page).toHaveURL(/\/orders\?kind=sample/, { timeout: 10_000 });
  });

  test('Returns shortcut redirects to filtered orders list', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/returns');
    await expect(page).toHaveURL(/\/orders\?kind=return/, { timeout: 10_000 });
  });
});
