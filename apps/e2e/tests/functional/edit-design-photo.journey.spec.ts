import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('edit design photos @functional @catalog', () => {
  test('tap photo opens viewer; × stays remove', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/catalog/products/seed-prod-6');
    await expect(page.getByRole('heading', { name: 'Edit design' })).toBeVisible({
      timeout: 15_000,
    });

    const thumb = page.getByTestId('design-photo-thumb').first();
    await expect(thumb).toBeVisible({ timeout: 15_000 });
    await thumb.click();
    await expect(page.getByTestId('photo-viewer')).toBeVisible();
    await page.getByTestId('photo-viewer-close').click();
    await expect(page.getByTestId('photo-viewer')).toHaveCount(0);

    await expect(page.getByTestId('design-photo-remove').first()).toBeVisible();
  });
});
