import { test } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('home showcase manager @visual', () => {
  test('empty Add cover without corner camera; Showcase Add at 390×844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsRavi(page);
    await page.goto('/');
    await page.getByTestId('business-profile-home').waitFor({ timeout: 15_000 });
    await page.getByTestId('showcase-add').waitFor();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: 'test-results/home-showcase-manager-390x844/hero.png',
      fullPage: false,
    });
  });
});
