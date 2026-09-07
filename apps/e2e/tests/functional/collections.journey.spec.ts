import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('collections journey @functional @collections', () => {
  test('shortlist designs then order clears selection', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/collections/seed-col-1');

    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });

    // Enter select via long-press (⋯ no longer has a Select pill).
    const designTile = page.locator('button, a').filter({ has: page.locator('img') }).first();
    await designTile.click({ button: 'right' });
    await page.getByRole('button', { name: 'Select all' }).first().click();
    await expect(page.getByText(/\d+ selected/)).toBeVisible();

    await page.getByRole('button', { name: 'Order', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ask rates' })).toBeVisible();
    await page.getByRole('button', { name: 'Ask rates' }).click();

    await expect(page).toHaveURL(/\/chats\//, { timeout: 20_000 });
    await page.goto('/collections/seed-col-1');
    await expect(page.getByText(/\d+ selected/)).toHaveCount(0);
  });
});
