import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('settings billing firms @functional @settings', () => {
  test('Add billing firm from Settings', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('settings-add-billing-firm').click();
    await expect(page.getByRole('heading', { name: 'New billing firm' })).toBeVisible();

    const suffix = Date.now().toString().slice(-6);
    await page.getByTestId('billing-firm-name').fill(`Test Billing ${suffix}`);
    await page.getByTestId('billing-firm-gst').fill('24AAAAA0000A1Z5');
    await page.getByTestId('billing-firm-save').click();

    await expect(page.getByText(`Test Billing ${suffix}`)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/GST · 24AAAAA0000A1Z5/i)).toBeVisible();
  });
});
