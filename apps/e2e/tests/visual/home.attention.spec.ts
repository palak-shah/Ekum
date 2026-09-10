import { test } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('home attention center @visual', () => {
  test.skip(!process.env.EKUM_VISUAL, 'Set EKUM_VISUAL=1 to capture 390×844 Home');

  test('Home at 390×844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsRavi(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'test-results/home-attention-390x844/home.png',
      fullPage: false,
    });
  });
});
