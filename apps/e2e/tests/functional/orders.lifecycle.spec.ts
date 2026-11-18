import { test, expect } from '@playwright/test';
import {
  accessTokenFromPage,
  createOrder,
  getOrder,
  quoteOrder,
} from '../../helpers/orders';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

test.describe('order lifecycle @functional @release @orders', () => {
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

    // Ticket dock is the reliable Accept surface; chat also carries Accept on the
    // newest canAcceptQuote card when the Rate pulse survives thread dedupe.
    await loginAsMeena(page);
    await page.goto(`/orders/${order.id}`);
    const dockAccept = page.getByTestId('order-dock-accept-quote');
    await expect(dockAccept).toBeVisible({ timeout: 15_000 });
    await dockAccept.click();

    await expect(page.getByTestId('order-dock-accept-quote')).toHaveCount(0, {
      timeout: 15_000,
    });
    await expect(page.getByText(/Accepted|confirmed|Quote accepted/i).first()).toBeVisible({
      timeout: 15_000,
    });

    const after = await getOrder(page.request, await accessTokenFromPage(page), order.id);
    expect(after.status).toMatch(/confirmed/i);

    await page.goto(`/chats/${order.threadId}`);
    await expect(page.getByText(/accepted quote|Accepted|confirmed/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
