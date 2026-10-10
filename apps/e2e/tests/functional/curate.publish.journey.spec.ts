import { test, expect } from '@playwright/test';
import { loginAsKavita, loginAsMeena } from '../../helpers/persona';
import { publishRepostNew } from '../../helpers/repost';

test.describe('trader curate publish @functional @trader @collections', () => {
  test('curate supplier designs and publish for buyers on Explore', async ({ page }) => {
    const packName = `Trader pack ${Date.now()}`;

    await loginAsKavita(page);
    await page.goto('/collections/seed-col-1');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });

    // Enter select via long-press (⋯ no longer has a Select pill / collection-select).
    const designTile = page.locator('button').filter({ has: page.locator('img') }).first();
    await designTile.click({ button: 'right' });
    await page.getByTestId('select-all-float-select-all').click();
    await expect(page.getByTestId('select-all-float')).toContainText(/\d+ selected/);

    await page.getByTestId('selection-workspace-cart').click();
    await page.goto('/selection');
    await expect(page.getByRole('heading', { name: 'Cart' })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('selection-curate').click();
    await expect(page.getByRole('heading', { name: 'Repost' })).toBeVisible({
      timeout: 15_000,
    });
    const collectionId = await publishRepostNew(page, packName);

    await expect(page.getByText(packName).first()).toBeVisible({ timeout: 15_000 });

    await loginAsMeena(page);
    await page.goto(`/collections/${collectionId}`);
    await expect(page.getByRole('heading', { name: packName })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Ahmedabad Loom Co/i).first()).toBeVisible();
    await expect(page.getByText(/\d+ designs?/i).first()).toBeVisible();
  });
});
