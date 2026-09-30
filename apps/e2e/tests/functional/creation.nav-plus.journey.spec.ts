import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('nav ＋ collection chooser @functional @creation @collections', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('Create new collection opens New collection', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/');
    await page.getByTestId('app-create-fab').click();
    await page.getByTestId('create-fab-new-collection').click();
    await expect(page).toHaveURL(/\/catalog\/collections\/new/, { timeout: 15_000 });
  });

  test('Update existing collection opens You Collections', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/');
    await page.getByTestId('app-create-fab').click();
    await page.getByTestId('create-fab-update-collection').click();
    await expect(page).toHaveURL(/\/more\?tab=collections/, { timeout: 15_000 });
    await expect(page.getByTestId('you-tab-collections')).toHaveAttribute('aria-selected', 'true');
  });
});
