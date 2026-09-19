import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('orders chrome @functional @orders', () => {
  test('Pending and Completed tabs replace Needs you / In progress', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/orders');

    await expect(page.getByRole('button', { name: 'Pending' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Completed' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Needs you' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'In progress' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Completed' }).click();
    await expect(page).toHaveURL(/filter=completed/, { timeout: 10_000 });

    await page.getByRole('button', { name: 'Pending' }).click();
    await expect(page).toHaveURL(/filter=pending/, { timeout: 10_000 });
  });

  test('How many each uses editable qty stepper', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/explore/products/seed-prod-1');
    await page.getByRole('button', { name: 'Order' }).click();
    await expect(page.getByTestId('how-many-lines')).toBeVisible({ timeout: 10_000 });
    const qty = page.getByRole('group', { name: /Pieces for/i }).getByRole('textbox');
    await qty.fill('175');
    await expect(qty).toHaveValue('175');
  });

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
