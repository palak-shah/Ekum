import { test, expect } from '@playwright/test';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

test.describe('explore journey @functional @explore', () => {
  test('browse seeded content, dismiss filter, open collection', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/explore');

    await expect(page.getByText('Search supplier, collection or design')).toBeVisible();
    await page.getByText('Search supplier, collection or design').click();
    await expect(page.getByLabel('Search')).toHaveAttribute(
      'placeholder',
      'Search supplier, collection or design',
    );
    await page.getByRole('button', { name: 'Back to Explore' }).click();

    await expect(page.getByText(/Wedding Edit|Surat Silk/i).first()).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByRole('button', { name: 'Buying' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Selling' })).toHaveCount(0);

    await page.getByTestId('explore-filter').click();
    await expect(page.getByTestId('explore-filter-menu')).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Change View/ })).toBeVisible();
    await expect(page.getByTestId('explore-trade-switch')).toHaveText('Explore Buyers');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('explore-filter-menu')).toHaveCount(0);

    const collectionLink = page.getByRole('link', { name: /Wedding Edit/i }).first();
    if (await collectionLink.count()) {
      await collectionLink.click();
    } else {
      await page.getByText(/Wedding Edit/i).first().click();
    }
    await expect(page).toHaveURL(/\/collections\//, { timeout: 10_000 });
  });

  test('design Ask / Order dock is visitor-only (owner never sees it)', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/explore/products/seed-prod-1');
    await expect(page.getByTestId('explore-product-trade-dock')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Ask for rates' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Order' })).toBeVisible();

    await loginAsRavi(page);
    await page.goto('/explore/products/seed-prod-1');
    await expect(page.getByRole('heading', { name: /Banarasi/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('explore-product-trade-dock')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Ask for rates' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Order' })).toHaveCount(0);
  });
});
