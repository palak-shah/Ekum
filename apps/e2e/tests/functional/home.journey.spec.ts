import { test, expect } from '@playwright/test';
import { accessTokenFromPage, createOrder } from '../../helpers/orders';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

test.describe('home journey @functional @home', () => {
  test('seller need opens order and dismisses after tap', async ({ page }) => {
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const order = await createOrder(page.request, meenaToken, {
      sellerCompanyId: 'seed-company-ravi',
      intent: 'order',
      items: [{ productId: 'seed-prod-1', quantity: 12 }],
    });

    await loginAsRavi(page);
    await page.goto('/');

    const singleNeed = page.getByTestId(`home-need-order-confirm_order-${order.id}`);
    const groupNeed = page.getByTestId('home-need-order-group-seed-company-meena-confirm_order');
    const need = singleNeed.or(groupNeed);

    await expect(need.first()).toBeVisible({ timeout: 15_000 });
    await expect(need.first()).toContainText(/Jaipur Emporium/i);

    await need.first().click();
    if ((await singleNeed.count()) > 0) {
      await expect(page).toHaveURL(new RegExp(`/orders/${order.id}`), { timeout: 10_000 });
    } else {
      await expect(page).toHaveURL(/\/orders\?filter=needs/, { timeout: 10_000 });
      await expect(page.url()).toMatch(/Jaipur/i);
    }

    await page.goto('/');
    await expect(singleNeed).toHaveCount(0, { timeout: 10_000 });
    await expect(groupNeed).toHaveCount(0);
  });
});
