import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('connection picker @functional @orders', () => {
  test('photo order: tap selected supplier row reopens picker', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/orders/new');

    await page.getByRole('button', { name: 'Choose supplier' }).click();
    await expect(page.getByRole('heading', { name: 'Choose supplier' })).toBeVisible();

    const firstSelect = page.getByRole('button', { name: /Select$/ }).first();
    const supplierName = await firstSelect.locator('p').first().textContent();
    expect(supplierName?.trim()).toBeTruthy();

    await firstSelect.click();
    await expect(page.getByRole('heading', { name: 'Choose supplier' })).toBeHidden();

    const selectedRow = page.getByRole('button', { name: new RegExp(supplierName!.trim()) });
    await expect(selectedRow).toBeVisible();
    await expect(page.getByRole('button', { name: 'Change' })).toHaveCount(0);

    await selectedRow.click();
    await expect(page.getByRole('heading', { name: 'Choose supplier' })).toBeVisible();
  });
});
