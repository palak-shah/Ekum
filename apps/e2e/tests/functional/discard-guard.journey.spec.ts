import path from 'node:path';
import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

const fixture = path.join(process.cwd(), 'fixtures/sample.jpg');

test.describe('discard guard @functional @orders', () => {
  test('photo order warns before leaving with photos added', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/orders/new');

    await page.locator('input[type="file"]').first().setInputFiles(fixture);
    await expect(page.locator('img[src^="blob:"]').first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('link', { name: 'Chats' }).click();
    await expect(page.getByTestId('discard-changes-sheet')).toBeVisible();
    await expect(page.getByText('Changes you have made will be discarded.')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Photo order' })).toBeVisible();

    await page.getByRole('link', { name: 'Chats' }).click();
    await page.getByRole('button', { name: 'Leave' }).click();
    await expect(page).toHaveURL(/\/chats/, { timeout: 10_000 });
  });
});
