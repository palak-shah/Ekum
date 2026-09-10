import { test } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

const VIEW = { width: 390, height: 844 };
const OUT = 'test-results/hierarchy-390x844';

test.describe('hierarchy trio @visual', () => {
  test.skip(!process.env.EKUM_VISUAL, 'Set EKUM_VISUAL=1 to recapture 390×844 shots');

  test('Home, Chats, Orders at 390×844', async ({ page }) => {
    await page.setViewportSize(VIEW);
    await loginAsRavi(page);

    await page.goto('/');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/home.png`, fullPage: false });

    await page.goto('/chats');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/chats.png`, fullPage: false });

    await page.goto('/orders');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/orders.png`, fullPage: false });
  });
});
