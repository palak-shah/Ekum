import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('photo order add @functional @orders', () => {
  test('no separate Choose from gallery link on photo order', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/orders/new');

    await expect(page.getByRole('button', { name: 'Add photos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Choose from gallery' })).toHaveCount(0);
    await expect(page.getByText('Choose from gallery')).toHaveCount(0);
  });
});

test.describe('photo order add phone @functional @orders', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });

  test('Add photos opens continuous camera with Gallery in chrome', async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    await loginAsMeena(page);
    await page.goto('/orders/new');

    await page.getByRole('button', { name: 'Add photos' }).click();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Gallery' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add photos' })).toHaveCount(0);
  });
});
