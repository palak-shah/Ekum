import { test, expect } from '@playwright/test';
import {
  accessTokenFromPage,
  createOrder,
  getOrder,
  quoteOrder,
} from '../../helpers/orders';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

test.describe('order lifecycle @functional @orders', () => {
  test('request → quote → accept → confirmed living card', async ({ page }) => {
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const order = await createOrder(page.request, meenaToken, {
      sellerCompanyId: 'seed-company-ravi',
      intent: 'order',
      items: [
        { productId: 'seed-prod-1', quantity: 40 },
        { productId: 'seed-prod-2', quantity: 40 },
      ],
    });

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    const detailed = await getOrder(page.request, raviToken, order.id);
    const quoteItems = detailed.items.map((item) => ({
      orderItemId: item.id,
      rate: 120,
      quantity: item.quantity,
    }));
    await quoteOrder(page.request, raviToken, order.id, quoteItems);

    await loginAsMeena(page);
    await page.goto(`/chats/${order.threadId}`);

    const accept = page.getByTestId(`accept-quote-${order.id}`);
    await expect(accept).toBeVisible({ timeout: 15_000 });
    await accept.click();

    await expect(page.getByTestId(`accept-quote-${order.id}`)).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByText(/Accepted|confirmed|Quote accepted/i).first()).toBeVisible({
      timeout: 15_000,
    });

    const after = await getOrder(page.request, await accessTokenFromPage(page), order.id);
    expect(after.status).toMatch(/confirmed/i);
  });
});
