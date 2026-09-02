import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('saved hub @functional @saved', () => {
  test('bookmark design from collection then find on Saved Designs tab', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/collections/seed-col-1');

    await expect(page.getByText('Banarasi Silk Saree').first()).toBeVisible({
      timeout: 15_000,
    });
    await page.getByText('Banarasi Silk Saree').first().click();

    const bookmark = page.getByRole('button', { name: 'Bookmark this design' });
    const bookmarked = page.getByRole('button', { name: 'Design bookmarked' });
    await expect(bookmark.or(bookmarked)).toBeVisible({ timeout: 10_000 });

    if (await bookmark.isVisible()) {
      await bookmark.click();
      await expect(bookmarked).toBeVisible({ timeout: 10_000 });
    }

    await page.goto('/saved');
    await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible();
    await expect(page.getByText(/Banarasi Silk Saree/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
