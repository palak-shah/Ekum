import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('collections journey @functional @collections', () => {
  test('shortlist designs then order clears selection', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/collections/seed-col-1');

    await page.getByTestId('collection-select').click();
    await page.getByRole('button', { name: 'Select all' }).first().click();
    await expect(page.getByText(/\d+ selected/)).toBeVisible();

    await page.getByRole('button', { name: 'Order', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ask rates' })).toBeVisible();
    await page.getByRole('button', { name: 'Ask rates' }).click();

    await expect(page.getByText(/\d+ selected/)).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByTestId('collection-select')).toHaveText(/Select/i);
  });
});
