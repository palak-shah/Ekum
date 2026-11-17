import { test } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

/** Formerly Needs attention Home — now own Business Profile on `/`. */
test.describe('home business profile @visual', () => {
  test.skip(!process.env.EKUM_VISUAL, 'Set EKUM_VISUAL=1 to capture 390×844 Home');

  test('Business profile at 390×844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsRavi(page);
    await page.goto('/');
    await page.getByTestId('business-profile-home').waitFor({ timeout: 15_000 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'test-results/home-business-profile-390x844/home.png',
      fullPage: false,
    });
  });
});
