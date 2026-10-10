import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('design set select @functional @explore', () => {
  test('Select on a shared set adds designs to the pile', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/designs/set?ids=seed-prod-1,seed-prod-2');
    await expect(page.getByTestId('design-set-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('photo-viewer')).toHaveCount(0);
    await expect(page.getByTestId('design-set-select')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('design-set-select').click();
    await expect(page.getByTestId('select-all-float')).toBeVisible();
    await page.getByTestId('select-all-float-select-all').click();
    await expect(page.getByTestId('design-set-trade-dock')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('design-set-order')).toBeVisible();
    await expect(page.getByTestId('selection-workspace-bar')).toHaveCount(0);
    await expect(page).toHaveURL(/\/designs\/set/);
  });
});
