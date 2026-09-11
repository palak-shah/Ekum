import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('explore long-press select @functional @explore', () => {
  test('long-press selects without leaving Explore', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/explore');
    await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 15_000 });

    const media = page.locator('.ekum-long-press-surface').first();
    await expect(media).toBeVisible({ timeout: 15_000 });

    const box = await media.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(500);
    await page.mouse.up();

    await expect(page).toHaveURL(/\/explore(?:\?|$)/);
    await expect(page.getByTestId('selection-workspace-bar')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('explore-filter')).toBeVisible();
  });
});
