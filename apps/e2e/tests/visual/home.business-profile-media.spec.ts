import { test } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('home business profile media @visual', () => {
  test('avatar and cover cameras at 390×844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsRavi(page);
    await page.goto('/');
    await page.getByTestId('business-profile-home').waitFor({ timeout: 15_000 });
    await page.getByTestId('business-profile-avatar-camera').waitFor();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: 'test-results/home-business-profile-media-390x844/hero.png',
      fullPage: false,
    });
  });
});
