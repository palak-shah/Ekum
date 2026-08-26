import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('explore journey @functional @explore', () => {
  test('browse seeded content, dismiss filter, open collection', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/explore');

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
});
