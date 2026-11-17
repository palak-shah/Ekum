import { test } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('profile visibility settings @visual', () => {
  test('Profile visibility at 390×844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsRavi(page);
    await page.goto('/settings');
    await page.getByTestId('settings-domain-privacy').waitFor({ timeout: 15_000 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: 'test-results/settings-privacy-domain-390x844/page.png',
      fullPage: false,
    });
    await page.goto('/settings/profile-visibility');
    await page.getByTestId('profile-visibility-page').waitFor({ timeout: 15_000 });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: 'test-results/settings-profile-visibility-390x844/page.png',
      fullPage: false,
    });
  });
});
