import { test } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('home business profile visual alignment @visual', () => {
  test('Home Business Profile at 390×844 and desktop', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/');
    await page.getByTestId('business-profile-home').waitFor({ timeout: 15_000 });
    await page.getByTestId('business-profile-avatar-block').waitFor();
    await page.waitForTimeout(700);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: 'test-results/home-business-profile-visual-390x844/after.png',
      fullPage: false,
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: 'test-results/home-business-profile-visual-desktop/after.png',
      fullPage: false,
    });
  });
});
